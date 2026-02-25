(function (global) {
  "use strict";

  function createLocalStorageBackend(key) {
    return {
      load() {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      },
      save(data) {
        localStorage.setItem(key, JSON.stringify(data));
      },
      clear() {
        localStorage.removeItem(key);
      }
    };
  }

  function createIndexedDBBackend(options) {
    const dbName = options?.dbName || "AppSuiteWebUISample";
    const storeName = options?.storeName || "state";
    const recordKey = options?.recordKey || "current";
    const dbVersion = Number(options?.dbVersion || 1);
    const migrations = options?.migrations || {};
    const metaStoreName = options?.metaStoreName || "_meta";
    const partitioned = !!options?.partitioned;
    const partitionKeys = Array.isArray(options?.partitionKeys) && options.partitionKeys.length
      ? options.partitionKeys
      : ["users","apps","incidents","changes","logs"];
    let lastSavedPartitionSnapshot = {};
    let dbPromise = null;

    function openDb() {
      if (dbPromise) return dbPromise;
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName, dbVersion);
        req.onupgradeneeded = (event) => {
          const db = req.result;
          const tx = req.transaction;
          const oldVersion = event.oldVersion || 0;
          const newVersion = event.newVersion || dbVersion;

          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains(metaStoreName)) {
            db.createObjectStore(metaStoreName, { keyPath: "key" });
          }
          if (partitioned) {
            partitionKeys.forEach((k) => {
              const partStore = `part_${k}`;
              if (!db.objectStoreNames.contains(partStore)) db.createObjectStore(partStore, { keyPath: "id" });
            });
          }

          // Run forward-only migrations for each schema version.
          for (let v = Math.max(1, oldVersion + 1); v <= newVersion; v += 1) {
            const migrate = migrations[v];
            if (typeof migrate === "function") {
              migrate({
                db,
                tx,
                storeName,
                metaStoreName,
                recordKey,
                fromVersion: oldVersion,
                toVersion: v
              });
            }
          }

          try {
            const metaStore = tx.objectStore(metaStoreName);
            metaStore.put({ key: "schemaVersion", value: newVersion, updatedAt: new Date().toISOString() });
            metaStore.put({ key: "lastUpgrade", value: { oldVersion, newVersion }, updatedAt: new Date().toISOString() });
          } catch (_) {
            // Ignore metadata failures during upgrade; primary store remains usable.
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
      });
      return dbPromise;
    }

    function requestToPromise(req) {
      return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error("IndexedDB request failed"));
      });
    }

    function formedSnapshot(data) {
      lastSavedPartitionSnapshot = clone(data);
    }

    function arrayToMap(arr) {
      return (Array.isArray(arr) ? arr : []).reduce((acc, item) => {
        if (!item || typeof item !== "object" || !item.id) return acc;
        acc[item.id] = item;
        return acc;
      }, {});
    }

    function txDone(tr) {
      return new Promise((resolve, reject) => {
        tr.oncomplete = () => resolve();
        tr.onerror = () => reject(tr.error || new Error("IndexedDB transaction failed"));
        tr.onabort = () => reject(tr.error || new Error("IndexedDB transaction aborted"));
      });
    }

    function clone(v) {
      return typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
    }

    function same(a, b) {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return {
      isAsync: true,
      async load() {
        const db = await openDb();
        if (partitioned) {
          const storeNames = [metaStoreName].concat(partitionKeys.map((k) => `part_${k}`)).filter((n) => db.objectStoreNames.contains(n));
          const tr = db.transaction(storeNames, "readonly");
          const metaReq = requestToPromise(tr.objectStore(metaStoreName).get("storageMode")).catch(() => null);
          const partReqs = partitionKeys
            .filter((k) => db.objectStoreNames.contains(`part_${k}`))
            .map((k) => ({ key: k, p: requestToPromise(tr.objectStore(`part_${k}`).getAll()) }));
          const [meta, ...partRows] = await Promise.all([metaReq].concat(partReqs.map((x) => x.p)));
          const assembled = {};
          let hasPartitionData = false;
          partReqs.forEach((req, i) => {
            const rows = partRows[i];
            if (rows && rows.length) {
              assembled[req.key] = rows.map((r) => r.payload ?? r);
              hasPartitionData = true;
            }
          });
          if (hasPartitionData || meta?.value === "partitioned") {
            formedSnapshot(assembled);
            return assembled;
          }
        }
        const tr = db.transaction(storeName, "readonly");
        const store = tr.objectStore(storeName);
        const row = await requestToPromise(store.get(recordKey));
        const payload = row ? row.payload : null;
        if (partitioned && payload && typeof payload === "object") lastSavedPartitionSnapshot = clone(payload);
        return payload;
      },
      async save(data) {
        const db = await openDb();
        if (partitioned) {
          const txnStores = [metaStoreName, storeName].concat(partitionKeys.map((k) => `part_${k}`)).filter((n) => db.objectStoreNames.contains(n));
          const tr = db.transaction(txnStores, "readwrite");
          const now = new Date().toISOString();
          partitionKeys.forEach((k) => {
            const storeNameKey = `part_${k}`;
            if (!db.objectStoreNames.contains(storeNameKey)) return;
            const currentRecords = Array.isArray(data?.[k]) ? arrayToMap(data[k]) : {};
            const beforeRecords = lastSavedPartitionSnapshot[k] ? arrayToMap(lastSavedPartitionSnapshot[k]) : {};
            Object.keys(currentRecords).forEach((id) => {
              const prev = beforeRecords[id];
              if (!prev || !same(prev, currentRecords[id])) tr.objectStore(storeNameKey).put({ id, payload: currentRecords[id], updatedAt: now });
            });
            Object.keys(beforeRecords).forEach((id) => {
              if (!(id in currentRecords)) tr.objectStore(storeNameKey).delete(id);
            });
          });
          tr.objectStore(metaStoreName).put({ key: "storageMode", value: "partitioned", updatedAt: now });
          tr.objectStore(metaStoreName).put({ key: "partitionKeys", value: partitionKeys, updatedAt: now });
          tr.objectStore(storeName).put({ id: recordKey, payload: data, updatedAt: now });
          await txDone(tr);
          formedSnapshot(clone(data));
          return;
        }
        const tr = db.transaction(storeName, "readwrite");
        const store = tr.objectStore(storeName);
        await requestToPromise(store.put({ id: recordKey, payload: data, updatedAt: new Date().toISOString() }));
      },
      async clear() {
        const db = await openDb();
        const names = [storeName, metaStoreName].concat(partitioned ? partitionKeys.map((k) => `part_${k}`) : []).filter((n) => db.objectStoreNames.contains(n));
        const tr = db.transaction(names, "readwrite");
        const requests = [requestToPromise(tr.objectStore(storeName).delete(recordKey))];
        if (partitioned) {
          for (const k of partitionKeys) {
            const name = `part_${k}`;
            if (db.objectStoreNames.contains(name)) requests.push(requestToPromise(tr.objectStore(name).delete(recordKey)));
          }
          requests.push(requestToPromise(tr.objectStore(metaStoreName).delete("storageMode")).catch(() => null));
        }
        await Promise.all(requests);
        await txDone(tr);
        lastSavedPartitionSnapshot = null;
      },
      getInfo() {
        return { type: "indexeddb", dbName, storeName, recordKey, dbVersion, partitioned, partitionKeys };
      }
    };
  }

  function createStore(opts) {
    const backend = opts.backend;
    const validateSnapshot = opts.validateSnapshot || (() => ({ valid: true, errors: [] }));
    const merge = opts.merge;
    const defaults = opts.defaults;

    return {
      async loadAsync() {
        const raw = await backend.load();
        if (!raw) return structuredClone(defaults);
        return merge(structuredClone(defaults), raw);
      },
      load() {
        const raw = backend.load();
        if (raw && typeof raw.then === "function") {
          throw new Error("Async backend detected. Use loadAsync().");
        }
        if (!raw) return structuredClone(defaults);
        return merge(structuredClone(defaults), raw);
      },
      save(state) {
        return backend.save(state);
      },
      saveSafe(state) {
        try {
          const ret = backend.save(state);
          if (ret && typeof ret.then === "function") ret.catch(() => {});
        } catch (_) {
          return;
        }
      },
      exportSnapshot(state) {
        return {
          schemaVersion: 3,
          exportedAt: new Date().toISOString(),
          app: "AppSuite WebUI Sample",
          state
        };
      },
      importSnapshot(snapshot) {
        const candidate = snapshot && snapshot.state ? snapshot.state : snapshot;
        const result = validateSnapshot(candidate);
        if (!result.valid) {
          return { ok: false, errors: result.errors };
        }
        return { ok: true, state: merge(structuredClone(defaults), candidate) };
      },
      validateSnapshot,
      getBackendInfo() {
        return typeof backend.getInfo === "function" ? backend.getInfo() : { type: "custom" };
      }
    };
  }

  const api = {
    createLocalStorageBackend,
    createIndexedDBBackend,
    createStore
  };

  global.AppSuiteDataStore = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
