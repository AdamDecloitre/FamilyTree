// Tree rendering and visualization logic

class TreeRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.tree = null;
        this.selectedPersonId = null;
        this.expandedNodes = new Set();
        this.focusedTree = null;
        this.isPanning = false;
        this.panStart = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };
        this._setupPanNavigation();
    }

    _setupPanNavigation() {
        if (!this.container) return;

        this.container.addEventListener('pointerdown', (event) => {
            if (event.target.closest('.person-node, button, input, select, textarea, a')) return;
            this.isPanning = true;
            this.panStart = {
                x: event.clientX,
                y: event.clientY,
                scrollLeft: this.container.scrollLeft,
                scrollTop: this.container.scrollTop
            };
            this.container.classList.add('is-panning');
            this.container.setPointerCapture(event.pointerId);
        });

        this.container.addEventListener('pointermove', (event) => {
            if (!this.isPanning) return;
            this.container.scrollLeft = this.panStart.scrollLeft - (event.clientX - this.panStart.x);
            this.container.scrollTop = this.panStart.scrollTop - (event.clientY - this.panStart.y);
        });

        const stopPanning = (event) => {
            if (!this.isPanning) return;
            this.isPanning = false;
            this.container.classList.remove('is-panning');
            if (event.pointerId !== undefined && this.container.hasPointerCapture(event.pointerId)) {
                this.container.releasePointerCapture(event.pointerId);
            }
        };

        this.container.addEventListener('pointerup', stopPanning);
        this.container.addEventListener('pointercancel', stopPanning);
    }

    render(tree) {
        this.tree = tree;
        if (!this.container) return;

        this.container.innerHTML = '';

        if (!tree || Object.keys(tree.people).length === 0) {
            this.container.innerHTML = '<p class="empty-state">No people in this tree yet. Add the first person!</p>';
            return;
        }

        // Find root people (those without parents or the designated root)
        let rootPeople = [];
        if (tree.rootPersonId && tree.people[tree.rootPersonId]) {
            rootPeople = [tree.people[tree.rootPersonId]];
        } else {
            rootPeople = Object.values(tree.people).filter(p => p.relationships.parentIds.length === 0);
        }

        if (rootPeople.length === 0) {
            rootPeople = Object.values(tree.people).slice(0, 1);
        }

        const treeDiv = document.createElement('div');
        treeDiv.className = 'family-tree-diagram';

        rootPeople.forEach(root => {
            treeDiv.appendChild(this._renderPersonNode(root, true, new Set()));
        });

        this.container.appendChild(treeDiv);
        requestAnimationFrame(() => {
            this._alignAllRails();
            requestAnimationFrame(() => this._focusInitialPerson(tree.rootPersonId || rootPeople[0]?.id));
        });
    }

    _renderPersonNode(person, includeChildren = true, ancestors = new Set()) {
        const branch = document.createElement('section');
        branch.className = 'tree-branch';
        const node = document.createElement('div');
        node.className = 'tree-node-group';

        if (ancestors.has(person.id)) return branch;
        const nextAncestors = new Set(ancestors);
        nextAncestors.add(person.id);

        const personDiv = document.createElement('div');
        personDiv.className = 'person-node';
        personDiv.dataset.personId = person.id;
        if (this.selectedPersonId === person.id) {
            personDiv.classList.add('selected');
        }

        // Avatar or initials
        const avatar = document.createElement('div');
        avatar.className = 'person-avatar';
        if (person.photos.length > 0) {
            avatar.style.backgroundImage = `url(${person.photos[0].data})`;
        } else {
            avatar.textContent = person.firstName.charAt(0) + person.lastName.charAt(0);
        }

        // Person info
        const info = document.createElement('div');
        info.className = 'person-info';

        const name = document.createElement('div');
        name.className = 'person-name';
        name.textContent = person.getFullName();

        const dates = document.createElement('div');
        dates.className = 'person-dates';
        let dateText = '';
        if (person.birthDate) dateText += person.birthDate;
        if (person.deathDate) dateText += ` - ${person.deathDate}`;
        dates.textContent = dateText;

        info.appendChild(name);
        if (dateText) info.appendChild(dates);

        personDiv.appendChild(avatar);
        personDiv.appendChild(info);

        personDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectPerson(person.id);
            document.dispatchEvent(new CustomEvent('personSelected', { detail: { personId: person.id } }));
        });

        node.appendChild(personDiv);

        const spouses = person.relationships.spouseIds
            .map(spouseId => this.tree.people[spouseId])
            .filter(spouse => spouse && !nextAncestors.has(spouse.id));
        spouses.forEach(spouse => {
            const spouseLink = document.createElement('span');
            spouseLink.className = 'relationship-link spouse-link';
            spouseLink.textContent = '♥';
            node.appendChild(spouseLink);
            node.appendChild(this._createPersonCard(spouse));
        });

        const childIds = [...new Set(person.relationships.childIds)]
            .filter(childId => this.tree.people[childId] && !nextAncestors.has(childId));
        if (includeChildren && childIds.length > 0) {
            node.classList.add('has-children');
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'tree-children';

            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'expand-toggle';
            toggleBtn.textContent = this.expandedNodes.has(person.id) ? '▼' : '▶';
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNode(person.id);
            });

            childrenDiv.appendChild(toggleBtn);

            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'children-container';
            if (!this.expandedNodes.has(person.id)) {
                childrenContainer.style.display = 'none';
            }

            childIds.forEach(childId => {
                const child = this.tree.people[childId];
                if (child) {
                    childrenContainer.appendChild(this._renderPersonNode(child, true, nextAncestors));
                }
            });

            childrenDiv.appendChild(childrenContainer);
            branch.appendChild(node);
            branch.appendChild(childrenDiv);
        } else {
            branch.appendChild(node);
        }

        return branch;
    }

    _alignAllRails() {
        this.container.querySelectorAll('.tree-children').forEach(childrenDiv => {
            const childrenContainer = childrenDiv.querySelector(':scope > .children-container');
            if (childrenContainer) this._alignChildrenRail(childrenDiv, childrenContainer);
        });
    }

    _focusInitialPerson(personId) {
        if (this.focusedTree === this.tree || !personId) return;
        const personNode = this.container.querySelector(`[data-person-id="${personId}"]`);
        if (!personNode) return;

        const frameRect = this.container.getBoundingClientRect();
        const personRect = personNode.getBoundingClientRect();
        const targetLeft = this.container.scrollLeft + personRect.left - frameRect.left +
            (personRect.width / 2) - (this.container.clientWidth / 2);
        const targetTop = this.container.scrollTop + personRect.top - frameRect.top +
            (personRect.height / 2) - (this.container.clientHeight / 2);

        this.container.scrollLeft = Math.max(0, Math.min(targetLeft, this.container.scrollWidth - this.container.clientWidth));
        this.container.scrollTop = Math.max(0, Math.min(targetTop, this.container.scrollHeight - this.container.clientHeight));
        this.focusedTree = this.tree || null;
    }

    _alignChildrenRail(childrenDiv, childrenContainer) {
        const childBranches = Array.from(childrenContainer.children);
        if (childBranches.length === 0) return;

        const node = childrenDiv.previousElementSibling;
        const heart = node?.querySelector('.spouse-link');
        if (node && heart) {
            const nodeRect = node.getBoundingClientRect();
            const heartRect = heart.getBoundingClientRect();
            const nodeCenter = nodeRect.left + nodeRect.width / 2;
            const heartCenter = heartRect.left + heartRect.width / 2;
            const offset = heartCenter - nodeCenter;
            node.style.setProperty('--drop-offset', `${offset}px`);
            childrenDiv.style.transform = `translateX(${offset}px)`;
        } else if (node) {
            node.style.setProperty('--drop-offset', '0px');
            childrenDiv.style.transform = '';
        }

        const containerRect = childrenDiv.getBoundingClientRect();
        const firstRect = childBranches[0].getBoundingClientRect();
        const lastRect = childBranches[childBranches.length - 1].getBoundingClientRect();
        const firstCenter = firstRect.left + firstRect.width / 2 - containerRect.left;
        const lastCenter = lastRect.left + lastRect.width / 2 - containerRect.left;

        childrenDiv.style.setProperty('--rail-left', `${firstCenter}px`);
        childrenDiv.style.setProperty('--rail-right', `${containerRect.width - lastCenter}px`);
    }

    _createPersonCard(person) {
        const card = document.createElement('div');
        card.className = 'person-node person-node-spouse';
        card.dataset.personId = person.id;
        if (this.selectedPersonId === person.id) card.classList.add('selected');

        const avatar = document.createElement('div');
        avatar.className = 'person-avatar';
        if (person.photos.length > 0) {
            avatar.style.backgroundImage = `url(${person.photos[0].data})`;
        } else {
            avatar.textContent = `${(person.firstName || '?').charAt(0)}${(person.lastName || '?').charAt(0)}`;
        }

        const info = document.createElement('div');
        info.className = 'person-info';
        const name = document.createElement('div');
        name.className = 'person-name';
        name.textContent = person.getFullName();
        info.appendChild(name);
        card.appendChild(avatar);
        card.appendChild(info);
        card.addEventListener('click', (event) => {
            event.stopPropagation();
            this.selectPerson(person.id);
            document.dispatchEvent(new CustomEvent('personSelected', { detail: { personId: person.id } }));
        });
        return card;
    }

    selectPerson(personId) {
        this.selectedPersonId = personId;
        // Remove previous selection
        document.querySelectorAll('.person-node.selected').forEach(node => {
            node.classList.remove('selected');
        });
        // Add new selection
        const nodes = document.querySelectorAll(`[data-person-id="${personId}"]`);
        nodes.forEach(node => node.classList.add('selected'));
    }

    toggleNode(personId) {
        if (this.expandedNodes.has(personId)) {
            this.expandedNodes.delete(personId);
        } else {
            this.expandedNodes.add(personId);
        }
        this.render(this.tree);
    }

    expandAll() {
        Object.keys(this.tree.people).forEach(id => {
            const person = this.tree.people[id];
            if (person.relationships.childIds.length > 0) {
                this.expandedNodes.add(id);
            }
        });
        this.render(this.tree);
    }

    collapseAll() {
        this.expandedNodes.clear();
        this.render(this.tree);
    }

    search(query) {
        const results = this.tree.search(query);
        return results;
    }

    highlightSearchResults(results) {
        this.container.innerHTML = '';
        const treeDiv = document.createElement('div');
        treeDiv.className = 'family-tree-diagram search-results';
        results.forEach(person => treeDiv.appendChild(this._renderPersonNode(person, false, new Set())));
        this.container.appendChild(treeDiv);
    }
}
