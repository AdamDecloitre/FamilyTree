// Export/Import .tree files. The file is the only persistent storage.

class FileManager {
    static _encodeBase64(text) {
        return btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode('0x' + p)));
    }

    static _decodeBase64(base64) {
        return decodeURIComponent(Array.prototype.map.call(atob(base64), c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
    }

    // Export tree to .tree file
    static exportTree(tree, filename = null) {
        try {
            if (!filename) {
                filename = `${tree.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.tree`;
            }

            const serialized = JSON.stringify(tree.serialize());

            // Add header and version
            const content = JSON.stringify({
                version: '1.0',
                type: 'FamilyTree',
                exportedAt: new Date().toISOString(),
                format: 'json',
                data: serialized
            });

            // Create blob and download
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Error exporting tree:', error);
            return false;
        }
    }

    // Import tree from .tree file
    static async importTree(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    const content = e.target.result;
                    const parsed = JSON.parse(content);

                    if (parsed.version !== '1.0' || parsed.type !== 'FamilyTree') {
                        reject(new Error('Invalid file format or version'));
                        return;
                    }

                    let serialized;
                    if (parsed.format === 'json') {
                        serialized = parsed.data;
                    } else if (parsed.format === 'plain') {
                        serialized = FileManager._decodeBase64(parsed.data);
                    } else {
                        throw new Error('Format de fichier non pris en charge');
                    }

                    const data = JSON.parse(serialized);
                    const tree = FamilyTree.deserialize(data);

                    resolve(tree);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    // Export a spreadsheet-compatible CSV.
    static exportToCSV(tree) {
        try {
            let csv = 'FirstName,LastName,BirthDate,BirthPlace,DeathDate,DeathPlace,Gender,Profession,Parents,Spouses,Children\n';

            Object.values(tree.people).forEach(person => {
                const row = [
                    person.firstName,
                    person.lastName,
                    person.birthDate || '',
                    person.birthPlace || '',
                    person.deathDate || '',
                    person.deathPlace || '',
                    person.gender,
                    person.profession || '',
                    person.relationships.parentIds.map(id => tree.people[id]?.getFullName()).join(';'),
                    person.relationships.spouseIds.map(id => tree.people[id]?.getFullName()).join(';'),
                    person.relationships.childIds.map(id => tree.people[id]?.getFullName()).join(';')
                ];

                csv += row.map(cell => `"${(cell + '').replace(/"/g, '""')}"`).join(',') + '\n';
            });

            const filename = `${tree.name.replace(/\s+/g, '_')}_export.csv`;
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            return false;
        }
    }

    // Helper: Convert file to base64
    static async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Helper: Convert base64 to blob
    static base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    // Download photo from person
    static downloadPhoto(person, photoId) {
        try {
            const photo = person.photos.find(p => p.id === photoId);
            if (!photo) return;

            const blob = FileManager.base64ToBlob(photo.data, 'image/jpeg');
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = photo.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading photo:', error);
        }
    }

    // Download document from person
    static downloadDocument(person, docId) {
        try {
            const doc = person.documents.find(d => d.id === docId);
            if (!doc) return;

            const mimeType = this._getMimeType(doc.type);
            const blob = FileManager.base64ToBlob(doc.data, mimeType);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading document:', error);
        }
    }

    static _getMimeType(type) {
        const mimeTypes = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'txt': 'text/plain',
            'doc': 'application/msword'
        };
        return mimeTypes[type.toLowerCase()] || 'application/octet-stream';
    }
}
