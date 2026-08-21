// Data structure definitions for FamilyTree

class Person {
    constructor(id, firstName, lastName, birthDate = null, birthPlace = null) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.birthDate = birthDate;
        this.birthPlace = birthPlace;
        this.deathDate = null;
        this.deathPlace = null;
        this.gender = 'other'; // 'male', 'female', 'other'
        this.profession = null;
        this.biography = null;
        this.photos = []; // Array of {id, name, data (base64)}
        this.documents = []; // Array of {id, name, type, data (base64)}
        this.relationships = {
            parentIds: [], // IDs of parents
            childIds: [], // IDs of children
            spouseIds: [], // IDs of spouses
            siblingIds: [] // IDs of siblings
        };
    }

    getFullName() {
        return `${this.firstName} ${this.lastName}`;
    }

    addPhoto(name, base64Data) {
        const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.photos.push({ id: photoId, name, data: base64Data });
        return photoId;
    }

    addDocument(name, type, base64Data) {
        const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.documents.push({ id: docId, name, type, data: base64Data });
        return docId;
    }

    removePhoto(photoId) {
        this.photos = this.photos.filter(p => p.id !== photoId);
    }

    removeDocument(docId) {
        this.documents = this.documents.filter(d => d.id !== docId);
    }

    addParent(parentId) {
        if (!this.relationships.parentIds.includes(parentId)) {
            this.relationships.parentIds.push(parentId);
        }
    }

    addChild(childId) {
        if (!this.relationships.childIds.includes(childId)) {
            this.relationships.childIds.push(childId);
        }
    }

    addSpouse(spouseId) {
        if (!this.relationships.spouseIds.includes(spouseId)) {
            this.relationships.spouseIds.push(spouseId);
        }
    }

    addSibling(siblingId) {
        if (!this.relationships.siblingIds.includes(siblingId)) {
            this.relationships.siblingIds.push(siblingId);
        }
    }

    removeParent(parentId) {
        this.relationships.parentIds = this.relationships.parentIds.filter(id => id !== parentId);
    }

    removeChild(childId) {
        this.relationships.childIds = this.relationships.childIds.filter(id => id !== childId);
    }

    removeSpouse(spouseId) {
        this.relationships.spouseIds = this.relationships.spouseIds.filter(id => id !== spouseId);
    }

    removeSibling(siblingId) {
        this.relationships.siblingIds = this.relationships.siblingIds.filter(id => id !== siblingId);
    }
}

class FamilyTree {
    constructor(treeName, rootPersonId = null) {
        this.id = `tree_${Date.now()}`;
        this.name = treeName;
        this.rootPersonId = rootPersonId;
        this.people = {}; // Map of id -> Person
        this.createdAt = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
        this.metadata = {
            totalPeople: 0,
            generations: 0,
            notes: ''
        };
    }

    addPerson(person) {
        this.people[person.id] = person;
        this.metadata.totalPeople = Object.keys(this.people).length;
        this.updatedAt = new Date().toISOString();
        return person.id;
    }

    getPerson(id) {
        return this.people[id] || null;
    }

    removePerson(id) {
        if (this.people[id]) {
            delete this.people[id];
            Object.values(this.people).forEach(person => {
                Object.keys(person.relationships).forEach(type => {
                    person.relationships[type] = person.relationships[type].filter(relatedId => relatedId !== id);
                });
            });
            if (this.rootPersonId === id) this.rootPersonId = null;
            this.metadata.totalPeople = Object.keys(this.people).length;
            this.updatedAt = new Date().toISOString();
            return true;
        }
        return false;
    }

    getDirectAncestors(personId, levels = null) {
        const ancestors = new Set();
        const visited = new Set();

        const traverse = (id, level) => {
            if (visited.has(id)) return;
            visited.add(id);

            if (levels !== null && level > levels) return;

            const person = this.people[id];
            if (!person) return;

            person.relationships.parentIds.forEach(parentId => {
                ancestors.add(parentId);
                traverse(parentId, level + 1);
            });
        };

        traverse(personId, 0);
        return Array.from(ancestors).map(id => this.people[id]).filter(p => p);
    }

    getDirectDescendants(personId, levels = null) {
        const descendants = new Set();
        const visited = new Set();

        const traverse = (id, level) => {
            if (visited.has(id)) return;
            visited.add(id);

            if (levels !== null && level > levels) return;

            const person = this.people[id];
            if (!person) return;

            person.relationships.childIds.forEach(childId => {
                descendants.add(childId);
                traverse(childId, level + 1);
            });
        };

        traverse(personId, 0);
        return Array.from(descendants).map(id => this.people[id]).filter(p => p);
    }

    search(query) {
        query = query.trim().toLowerCase();
        if (!query) return [];
        return Object.values(this.people).filter(person =>
            (person.firstName || '').toLowerCase().includes(query) ||
            (person.lastName || '').toLowerCase().includes(query) ||
            (person.profession && person.profession.toLowerCase().includes(query))
        );
    }

    calculateGenerations() {
        if (Object.keys(this.people).length === 0) return 0;

        let maxDepth = 0;
        const getDepth = (id, depth = 0, path = new Set()) => {
            if (path.has(id)) return depth;

            const person = this.people[id];
            if (!person || person.relationships.childIds.length === 0) {
                return depth;
            }

            const nextPath = new Set(path);
            nextPath.add(id);
            let maxChildDepth = depth;
            person.relationships.childIds.forEach(childId => {
                const childDepth = getDepth(childId, depth + 1, nextPath);
                maxChildDepth = Math.max(maxChildDepth, childDepth);
            });

            return maxChildDepth;
        };

        if (this.rootPersonId) {
            maxDepth = getDepth(this.rootPersonId);
        } else {
            // Find the oldest ancestors and calculate from there
            Object.keys(this.people).forEach(id => {
                const person = this.people[id];
                if (person.relationships.parentIds.length === 0) {
                    const depth = getDepth(id);
                    maxDepth = Math.max(maxDepth, depth);
                }
            });
        }

        this.metadata.generations = maxDepth + 1;
        return this.metadata.generations;
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            rootPersonId: this.rootPersonId,
            people: this.people,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            metadata: this.metadata
        };
    }

    static deserialize(data) {
        const tree = new FamilyTree(data.name, data.rootPersonId);
        tree.id = data.id;
        tree.createdAt = data.createdAt;
        tree.updatedAt = data.updatedAt;
        tree.metadata = data.metadata || { totalPeople: 0, generations: 0, notes: '' };

        // Recreate Person objects
        Object.values(data.people).forEach(personData => {
            const person = new Person(
                personData.id,
                personData.firstName,
                personData.lastName,
                personData.birthDate,
                personData.birthPlace
            );
            Object.assign(person, personData);
            person.relationships = {
                parentIds: [],
                childIds: [],
                spouseIds: [],
                siblingIds: [],
                ...(person.relationships || {})
            };
            person.photos = person.photos || [];
            person.documents = person.documents || [];
            tree.people[person.id] = person;
        });

        return tree;
    }
}

// Provide legacy/global aliases for compatibility
window.Tree = FamilyTree;
window.FamilyTree = FamilyTree;
window.Person = Person;
