# FamilyTree

FamilyTree is a static web application for building and visualizing family trees. It runs directly in a web browser and can be hosted on GitHub Pages.

## Important: nothing is saved on the website

FamilyTree does not save your data on the website.

- No user account is required.
- No data is sent to a server.
- Nothing is stored in `localStorage` or `sessionStorage`.
- No tree is automatically restored after closing or reloading the page.
- The current tree exists only in memory in the open browser tab.

The downloaded `.tree` file on your computer is the only durable backup of your tree.

**Export your tree before closing, reloading, or leaving the page.** Without a recent export, changes made since the last export may be lost.

## What the application does

FamilyTree lets you:

- create a family tree;
- add people and personal information;
- connect parents, children, spouses, and siblings;
- visualize relationships as a branching family tree;
- expand and collapse branches;
- navigate large trees with click-and-drag;
- search by name or profession;
- add photos and documents;
- export and import `.tree` files;
- export basic information as CSV.

## Quick Start

### 1. Create a new tree

1. Open `index.html` or the GitHub Pages website.
2. Click **Create New Tree**.
3. Enter a name for the tree.
4. A first person is automatically created as the root person.
5. The editor opens with the root person centered in the view.

The root person is the visual starting point of the tree. You can edit or delete this person like anyone else.

### 2. Import an existing tree

1. From the home page, click **Open Existing Tree**.
2. Click **Choose .tree file**.
3. Select a `.tree` file from your computer.
4. The tree is loaded into the editor.

Importing a file does not upload or copy it to the website. Its contents remain only in memory during the current editing session.

### 3. Add a person

In the editor:

1. Click **Add Person**.
2. Enter at least a first name and last name.
3. You can also add:
   - gender;
   - birth date and place;
   - death date and place;
   - profession;
   - biography;
   - photo;
   - document.
4. Click **Add Person** in the dialog.

The new person is added to the current in-memory tree. They will only be permanently kept after exporting a `.tree` file.

### 4. Edit a person

1. Click a person card in the tree.
2. The person's details open in the side panel.
3. Click **Edit**.
4. Update the information.
5. Add a new photo or document if needed.
6. Click **Save Changes**.

### 5. Connect people

1. Click the person you want to edit.
2. In the details panel, click **Relationship**.
3. Choose a relationship type:
   - **Parent**: the selected person becomes a child of the chosen person;
   - **Child**: the chosen person becomes a child of the selected person;
   - **Spouse**: adds a spouse;
   - **Sibling**: adds a brother or sister.
4. Select the person to connect.
5. Click **Add Relationship**.

Parent-child and spouse relationships are added in both directions so the tree remains consistent.

### 6. Read and navigate the tree

- Cards represent people.
- The heart represents a spouse relationship.
- Lines connect couples to their children.
- The round button expands or collapses a branch.
- **Expand All** opens every branch.
- **Collapse All** closes every branch.
- The root person is centered automatically on the first display.
- To navigate a large tree, click the background and drag with the mouse.
- The dotted background provides a visual navigation reference.
- Cards and buttons remain clickable normally.

On mobile, use one finger to drag the tree background.

### 7. Search for a person

Use the **Search by name or profession** field.

The search displays people whose first name, last name, or profession matches the query. Clear the field to return to the complete tree.

### 8. Export the tree

Exporting is the required step to permanently save your work.

1. Open the **Import/Export** menu.
2. Click **Export Tree**.
3. A file with the `.tree` extension is downloaded.
4. Keep this file somewhere safe on your computer.

You can rename or move the file, but do not edit its contents manually. To continue working later, import the same file from the home page.

**Tip: export after every important set of changes.**

### 9. Export CSV

The **Export as CSV** button downloads the main text information in a spreadsheet-compatible format.

The CSV includes, among other things:

- names;
- dates and places;
- professions;
- parents;
- spouses;
- children.

Photos and documents are not included in the CSV. Use the `.tree` file to preserve media.

## Photos and documents

Photos and documents are kept in memory while editing and embedded in the `.tree` file when you export it.

- Photos are used as avatars in cards and details panels.
- Documents can be PDFs, images, or text files.
- Large files produce larger `.tree` exports.
- Resize or compress media before adding it when necessary.

The website does not store any of these files online.

## The `.tree` file format

A `.tree` file is a JSON file with a dedicated extension. It contains:

- tree information;
- people;
- relationships;
- encoded photos;
- encoded documents;
- export timestamps.

General structure:

```json
{
  "version": "1.0",
  "type": "FamilyTree",
  "exportedAt": "2026-08-21T12:00:00.000Z",
  "format": "json",
  "data": "serialized tree JSON"
}
```

The `.tree` file is the portable backup format of the application. It can be imported on another computer or another deployment of the website.

## Local usage

You can open `index.html` directly or start a local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Important limitations

- Closing or reloading the page without exporting may lose recent changes.
- There is no automatic synchronization between devices.
- There is no user account or online collaboration.
- `.tree` files can become large when they contain many photos or documents.
- The browser must allow JavaScript and file downloads.

## Troubleshooting

### My tree disappeared

This happens if the tree was not exported before closing or reloading the page. Import your latest `.tree` file.

### My file will not import

Make sure it is a valid `.tree` file exported by FamilyTree. Do not edit its contents with a text editor.

### I cannot see the whole family

Drag the tree background to move around the frame. Expand branches with the round buttons.

### My export is very large

Resize or compress photos and documents before adding them. Media is embedded in the `.tree` file.

## Project structure

```text
FamilyTree/
├── index.html       # Home page and action launcher
├── manager.html     # Create/import entry point
├── app.html         # In-memory tree editor
├── css/
│   └── style.css    # Styles and visualization
├── js/
│   ├── data.js      # People, relationships, and tree model
│   ├── storage.js   # Temporary in-memory layer only
│   ├── export.js    # .tree and CSV import/export
│   ├── tree.js      # Tree rendering and navigation
│   ├── ui.js        # Details panels and forms
│   └── app.js       # Application utilities
└── README.md        # Documentation
```

## License

MIT
