// UI Components and Event Handlers

class UIManager {
    constructor() {
        this.currentTree = null;
        this.treeRenderer = null;
        this.modals = {};
    }

    // Modal management
    createModal(id, title, content, buttons = []) {
        this.removeModal(id);
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = `modal_${id}`;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal(id);
        });

        const dialog = document.createElement('div');
        dialog.className = 'modal-dialog';

        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `<h2>${title}</h2><button class="modal-close" onclick="ui.closeModal('${id}')">&times;</button>`;

        const body = document.createElement('div');
        body.className = 'modal-body';
        body.innerHTML = content;

        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `btn ${btn.className || ''}`;
            button.textContent = btn.text;
            button.addEventListener('click', btn.onClick);
            footer.appendChild(button);
        });

        dialog.appendChild(header);
        dialog.appendChild(body);
        if (buttons.length > 0) dialog.appendChild(footer);

        overlay.appendChild(dialog);
        modal.appendChild(overlay);
        document.body.appendChild(modal);

        this.modals[id] = { modal, overlay, dialog };
    }

    openModal(id) {
        if (this.modals[id]) {
            this.modals[id].modal.style.display = 'flex';
        }
    }

    closeModal(id) {
        if (this.modals[id]) {
            this.modals[id].modal.style.display = 'none';
        }
    }

    removeModal(id) {
        if (this.modals[id]) {
            this.modals[id].modal.remove();
            delete this.modals[id];
        }
    }

    // Notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        const container = document.getElementById('notificationsContainer') || (() => {
            const div = document.createElement('div');
            div.id = 'notificationsContainer';
            div.className = 'notifications-container';
            document.body.appendChild(div);
            return div;
        })();

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    // Form helper
    createFormField(label, inputType = 'text', name = '', value = '', required = false) {
        const field = document.createElement('div');
        field.className = 'form-field';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        if (required) labelEl.innerHTML += ' <span class="required">*</span>';

        const input = document.createElement('input');
        input.type = inputType;
        input.name = name;
        input.value = value;
        input.required = required;

        field.appendChild(labelEl);
        field.appendChild(input);

        return { field, input };
    }

    createTextareaField(label, name = '', value = '', rows = 3) {
        const field = document.createElement('div');
        field.className = 'form-field';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;

        const textarea = document.createElement('textarea');
        textarea.name = name;
        textarea.value = value;
        textarea.rows = rows;

        field.appendChild(labelEl);
        field.appendChild(textarea);

        return { field, textarea };
    }

    // Detailed person card
    createPersonCard(person, tree) {
        const card = document.createElement('div');
        card.className = 'person-card';

        // Header with close button
        const header = document.createElement('div');
        header.className = 'person-card-header';
        header.innerHTML = `
            <h2>${person.getFullName()}</h2>
            <button class="btn-close" onclick="ui.closePersonCard()">&times;</button>
        `;

        // Main content
        const content = document.createElement('div');
        content.className = 'person-card-content';

        // Photo section
        if (person.photos.length > 0) {
            const photoSection = document.createElement('div');
            photoSection.className = 'photo-section';
            const img = document.createElement('img');
            img.src = person.photos[0].data;
            img.alt = person.getFullName();
            photoSection.appendChild(img);
            content.appendChild(photoSection);
        }

        // Info sections
        const infoHtml = `
            <div class="person-card-section">
                <h3>Personal Information</h3>
                <div class="info-grid">
                    <div class="info-row">
                        <span class="info-label">Birth Date:</span>
                        <span class="info-value">${person.birthDate || 'Unknown'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Birth Place:</span>
                        <span class="info-value">${person.birthPlace || 'Unknown'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Death Date:</span>
                        <span class="info-value">${person.deathDate || 'Still living'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Death Place:</span>
                        <span class="info-value">${person.deathPlace || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Gender:</span>
                        <span class="info-value">${person.gender}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Profession:</span>
                        <span class="info-value">${person.profession || 'Unknown'}</span>
                    </div>
                </div>
            </div>

            ${person.biography ? `
                <div class="person-card-section">
                    <h3>Biography</h3>
                    <p>${person.biography}</p>
                </div>
            ` : ''}

            ${person.relationships.parentIds.length > 0 ? `
                <div class="person-card-section">
                    <h3>Parents</h3>
                    <ul class="relationships-list">
                        ${person.relationships.parentIds.map(id => {
                            const parent = tree.people[id];
                            return parent ? `<li><a href="#" onclick="event.preventDefault(); ui.viewPerson('${id}')">${parent.getFullName()}</a></li>` : '';
                        }).join('')}
                    </ul>
                </div>
            ` : ''}

            ${person.relationships.spouseIds.length > 0 ? `
                <div class="person-card-section">
                    <h3>Spouses</h3>
                    <ul class="relationships-list">
                        ${person.relationships.spouseIds.map(id => {
                            const spouse = tree.people[id];
                            return spouse ? `<li><a href="#" onclick="event.preventDefault(); ui.viewPerson('${id}')">${spouse.getFullName()}</a></li>` : '';
                        }).join('')}
                    </ul>
                </div>
            ` : ''}

            ${person.relationships.childIds.length > 0 ? `
                <div class="person-card-section">
                    <h3>Children</h3>
                    <ul class="relationships-list">
                        ${person.relationships.childIds.map(id => {
                            const child = tree.people[id];
                            return child ? `<li><a href="#" onclick="event.preventDefault(); ui.viewPerson('${id}')">${child.getFullName()}</a></li>` : '';
                        }).join('')}
                    </ul>
                </div>
            ` : ''}

            ${person.relationships.siblingIds.length > 0 ? `
                <div class="person-card-section">
                    <h3>Siblings</h3>
                    <ul class="relationships-list">
                        ${person.relationships.siblingIds.map(id => {
                            const sibling = tree.people[id];
                            return sibling ? `<li><a href="#" onclick="event.preventDefault(); ui.viewPerson('${id}')">${sibling.getFullName()}</a></li>` : '';
                        }).join('')}
                    </ul>
                </div>
            ` : ''}

            ${person.documents.length > 0 ? `
                <div class="person-card-section">
                    <h3>Documents</h3>
                    <ul class="documents-list">
                        ${person.documents.map(doc => `
                            <li>
                                <span>${doc.name}</span>
                                <button class="btn-small" onclick="FileManager.downloadDocument(currentPerson, '${doc.id}')">Download</button>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;

        content.innerHTML = infoHtml;

        // Action buttons
        const actions = document.createElement('div');
        actions.className = 'person-card-actions';
        actions.innerHTML = `
            <button class="btn btn-secondary" onclick="ui.addRelationship('${person.id}')">Relationship</button>
            <button class="btn btn-primary" onclick="ui.editPerson('${person.id}')">Edit</button>
            <button class="btn btn-danger" onclick="ui.deletePerson('${person.id}')">Delete</button>
        `;

        card.appendChild(header);
        card.appendChild(content);
        card.appendChild(actions);

        return card;
    }

    closePersonCard() {
        const card = document.querySelector('.person-card');
        if (card) card.remove();
    }

    viewPerson(personId) {
        if (!this.currentTree) return;
        const person = this.currentTree.people[personId];
        if (!person) return;

        this.closePersonCard();
        const card = this.createPersonCard(person, this.currentTree);
        document.body.appendChild(card);
        window.currentPerson = person;
    }

    editPerson(personId) {
        if (!this.currentTree) return;
        const person = this.currentTree.people[personId];
        if (!person) return;

        const content = `
            <div class="form-row">
                <div class="form-field">
                    <label>First Name <span class="required">*</span></label>
                    <input type="text" id="editFirstName" value="${person.firstName}" required>
                </div>
                <div class="form-field">
                    <label>Last Name <span class="required">*</span></label>
                    <input type="text" id="editLastName" value="${person.lastName}" required>
                </div>
            </div>

            <div class="form-row">
                <div class="form-field">
                    <label>Gender</label>
                    <select id="editGender">
                        <option value="other" ${person.gender === 'other' ? 'selected' : ''}>Other</option>
                        <option value="male" ${person.gender === 'male' ? 'selected' : ''}>Male</option>
                        <option value="female" ${person.gender === 'female' ? 'selected' : ''}>Female</option>
                    </select>
                </div>
                <div class="form-field">
                    <label>Profession</label>
                    <input type="text" id="editProfession" value="${person.profession || ''}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-field">
                    <label>Birth Date</label>
                    <input type="date" id="editBirthDate" value="${person.birthDate || ''}">
                </div>
                <div class="form-field">
                    <label>Birth Place</label>
                    <input type="text" id="editBirthPlace" value="${person.birthPlace || ''}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-field">
                    <label>Death Date</label>
                    <input type="date" id="editDeathDate" value="${person.deathDate || ''}">
                </div>
                <div class="form-field">
                    <label>Death Place</label>
                    <input type="text" id="editDeathPlace" value="${person.deathPlace || ''}">
                </div>
            </div>

            <div class="form-field">
                <label>Biography</label>
                <textarea id="editBiography">${person.biography || ''}</textarea>
            </div>

            <div class="form-field">
                <label>Photo</label>
                <input type="file" id="editPhotoInput" accept="image/*">
                ${person.photos.length > 0 ? `<p style="margin-top: 10px; font-size: 0.9rem; color: var(--text-secondary);">Current photo: ${person.photos[0].name}</p>` : ''}
            </div>

            <div class="form-field">
                <label>Add Document</label>
                <input type="file" id="editDocumentInput">
            </div>
        `;

        this.createModal('editPerson', `Edit ${person.getFullName()}`, content, [
            {
                text: 'Cancel',
                className: 'btn-secondary',
                onClick: () => this.closeModal('editPerson')
            },
            {
                text: 'Save Changes',
                className: 'btn-primary',
                onClick: () => this.savePersonChanges(personId)
            }
        ]);

        this.openModal('editPerson');
    }

    async savePersonChanges(personId) {
        if (!this.currentTree) return;
        const person = this.currentTree.people[personId];
        if (!person) return;

        const firstName = document.getElementById('editFirstName').value;
        const lastName = document.getElementById('editLastName').value;

        if (!firstName || !lastName) {
            this.showNotification('First name and last name are required', 'warning');
            return;
        }

        person.firstName = firstName;
        person.lastName = lastName;
        person.gender = document.getElementById('editGender').value;
        person.profession = document.getElementById('editProfession').value || null;
        person.birthDate = document.getElementById('editBirthDate').value || null;
        person.birthPlace = document.getElementById('editBirthPlace').value || null;
        person.deathDate = document.getElementById('editDeathDate').value || null;
        person.deathPlace = document.getElementById('editDeathPlace').value || null;
        person.biography = document.getElementById('editBiography').value || null;

        // Handle photo
        const photoInput = document.getElementById('editPhotoInput');
        if (photoInput.files.length > 0) {
            person.photos = [];
            const photoBase64 = await FileManager.fileToBase64(photoInput.files[0]);
            person.addPhoto(photoInput.files[0].name, photoBase64);
        }

        const documentInput = document.getElementById('editDocumentInput');
        if (documentInput.files.length > 0) {
            const file = documentInput.files[0];
            const extension = file.name.split('.').pop().toLowerCase();
            const documentBase64 = await FileManager.fileToBase64(file);
            person.addDocument(file.name, extension, documentBase64);
        }

        storage.saveTree(this.currentTree);
        this.closeModal('editPerson');
        this.closePersonCard();
        this.treeRenderer.render(this.currentTree);
        this.showNotification(`${person.getFullName()} updated successfully!`, 'success');
        window.hasUnsavedChanges = true;
        if (window.updateUnsavedBadge) window.updateUnsavedBadge();
    }

    addRelationship(personId) {
        if (!this.currentTree) return;
        const person = this.currentTree.people[personId];
        if (!person) return;

        const options = Object.values(this.currentTree.people)
            .filter(candidate => candidate.id !== personId)
            .map(candidate => `<option value="${candidate.id}">${candidate.getFullName()}</option>`)
            .join('');
        const content = `
            <div class="form-field">
                <label>Relationship type</label>
                <select id="relationshipType">
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="spouse">Spouse</option>
                    <option value="sibling">Sibling</option>
                </select>
            </div>
            <div class="form-field">
                <label>Person</label>
                <select id="relationshipPerson">${options}</select>
            </div>`;

        this.createModal('relationship', `Relationship for ${person.getFullName()}`, content, [
            { text: 'Cancel', className: 'btn-secondary', onClick: () => this.closeModal('relationship') },
            { text: 'Add Relationship', className: 'btn-primary', onClick: () => this.saveRelationship(personId) }
        ]);
        this.openModal('relationship');
    }

    saveRelationship(personId) {
        const person = this.currentTree.people[personId];
        const relatedId = document.getElementById('relationshipPerson').value;
        const type = document.getElementById('relationshipType').value;
        const related = this.currentTree.people[relatedId];
        if (!person || !related) return;

        if (type === 'parent') {
            person.addParent(relatedId);
            related.addChild(personId);
        } else if (type === 'child') {
            person.addChild(relatedId);
            related.addParent(personId);
        } else if (type === 'spouse') {
            person.addSpouse(relatedId);
            related.addSpouse(personId);
        } else {
            person.addSibling(relatedId);
            related.addSibling(personId);
        }

        storage.saveTree(this.currentTree);
        window.hasUnsavedChanges = true;
        if (window.updateUnsavedBadge) window.updateUnsavedBadge();
        this.closeModal('relationship');
        this.closePersonCard();
        this.treeRenderer.render(this.currentTree);
        this.showNotification('Relationship added successfully!', 'success');
    }

    deletePerson(personId) {
        if (!confirm('Are you sure you want to delete this person?')) return;

        if (this.currentTree.removePerson(personId)) {
            storage.saveTree(this.currentTree);
            window.hasUnsavedChanges = true;
            if (window.updateUnsavedBadge) window.updateUnsavedBadge();
            this.closePersonCard();
            this.treeRenderer.render(this.currentTree);
            this.showNotification('Person deleted successfully', 'success');
        }
    }
}

// Global UI instance
const ui = new UIManager();
