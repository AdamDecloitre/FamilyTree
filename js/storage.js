// Temporary in-memory storage for the current editing page.

class InMemoryStorage {
    constructor() {
        this.data = {};
    }

    get length() {
        return Object.keys(this.data).length;
    }

    key(index) {
        return Object.keys(this.data)[index] || null;
    }

    getItem(key) {
        return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null;
    }

    setItem(key, value) {
        this.data[key] = String(value);
    }

    removeItem(key) {
        delete this.data[key];
    }
}

class StorageManager {
    constructor() {
        this.prefix = 'familytree_';
        this.treesListKey = this.prefix + 'trees_list';
        this.currentTreeKey = this.prefix + 'current_tree';
        this.lastErrorMessage = null;
        this.storage = new InMemoryStorage();
        this.storageType = 'memory';
    }

    // Keep the current tree available to the active page only.
    saveTree(tree) {
        try {
            const serialized = JSON.stringify(tree.serialize());
            this.storage.setItem(`${this.prefix}tree_${tree.id}`, serialized);
            this._updateTreesList(tree.id, tree.name);
            this.lastErrorMessage = 'Les modifications restent en mémoire jusqu’à l’export du fichier .tree.';
            return true;
        } catch (error) {
            console.error('Error saving tree:', error);
            this.lastErrorMessage = error.message || 'Unknown storage error';
            return false;
        }
    }

    // Load a tree from storage
    loadTree(treeId) {
        try {
            const serialized = this.storage.getItem(`${this.prefix}tree_${treeId}`);
            if (!serialized) return null;

            const data = JSON.parse(serialized);
            const tree = FamilyTree.deserialize(data);
            return tree;
        } catch (error) {
            console.error('Error loading tree:', error);
            return null;
        }
    }

    // Get list of all trees
    getTreesList() {
        try {
            const list = this.storage.getItem(this.treesListKey);
            return list ? JSON.parse(list) : [];
        } catch (error) {
            console.error('Error getting trees list:', error);
            return [];
        }
    }

    // Update the trees list
    _updateTreesList(treeId, treeName) {
        try {
            const list = this.getTreesList();
            const existing = list.find(t => t.id === treeId);

            if (existing) {
                existing.name = treeName;
                existing.updatedAt = new Date().toISOString();
            } else {
                list.push({
                    id: treeId,
                    name: treeName,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            this.storage.setItem(this.treesListKey, JSON.stringify(list));
        } catch (error) {
            console.error('Error updating trees list:', error);
            this.lastErrorMessage = error.message || 'Unknown storage error';
        }
    }

    // Delete a tree
    deleteTree(treeId) {
        try {
            this.storage.removeItem(`${this.prefix}tree_${treeId}`);
            const list = this.getTreesList();
            const filtered = list.filter(t => t.id !== treeId);
            this.storage.setItem(this.treesListKey, JSON.stringify(filtered));

            // If it was the current tree, clear it
            if (this.storage.getItem(this.currentTreeKey) === treeId) {
                this.storage.removeItem(this.currentTreeKey);
            }

            return true;
        } catch (error) {
            console.error('Error deleting tree:', error);
            this.lastErrorMessage = error.message || 'Unknown storage error';
            return false;
        }
    }

    // Set current active tree
    setCurrentTree(treeId) {
        this.storage.setItem(this.currentTreeKey, treeId);
    }

    // Get current active tree
    getCurrentTree() {
        return this.storage.getItem(this.currentTreeKey) || null;
    }

    // Rename a tree
    renameTree(treeId, newName) {
        try {
            const tree = this.loadTree(treeId);
            if (!tree) return false;

            tree.name = newName;
            tree.updatedAt = new Date().toISOString();
            this.saveTree(tree);
            return true;
        } catch (error) {
            console.error('Error renaming tree:', error);
            return false;
        }
    }

    // Get storage size info
    getStorageInfo() {
        try {
            let totalSize = 0;
            const trees = this.getTreesList();

            trees.forEach(treeInfo => {
                const data = this.storage.getItem(`${this.prefix}tree_${treeInfo.id}`);
                if (data) {
                    totalSize += data.length;
                }
            });

            // Rough estimate: 1 character ≈ 1 byte
            const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
            return {
                treesCount: trees.length,
                totalSizeBytes: totalSize,
                totalSizeMB: parseFloat(sizeInMB),
                availableSpaceMB: ((5 * 1024 * 1024 - totalSize) / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }

    // Check if storage has enough space for new tree
    hasSpace(estimatedSize = 1000000) {
        const info = this.getStorageInfo();
        return info && (5 * 1024 * 1024 - info.totalSizeBytes) > estimatedSize;
    }

    // Clear all trees (caution!)
    clearAll() {
        try {
            const keys = [];
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keys.push(key);
                }
            }
            keys.forEach(key => this.storage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Error clearing all:', error);
            this.lastErrorMessage = error.message || 'Unknown storage error';
            return false;
        }
    }

}

// Global instance
const storage = new StorageManager();
