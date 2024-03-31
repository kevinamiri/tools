

```ts
import * as fs from 'fs';
import * as path from 'path';

export class JsonFileManager {
    private filePath: string;
    private data: any;

    constructor(initialPath: string) {
        this.filePath = path.resolve(initialPath);
        this.ensureFileExists();
        this.data = this.read();
    }

    private ensureFileExists(): void {
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
        }
    }

    private read(): any {
        const data = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(data);
    }
    private write(): void {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    }

    public setPath(newPath: string): this {
        this.filePath = path.resolve(newPath);
        this.ensureFileExists();
        this.data = this.read();
        this.write();
        return this;
    }

    public append(item: any): this {
        if (!Array.isArray(this.data)) {
            this.data = []; // Initialize as array if not already
        }
        this.data.push(item);
        this.write();
        return this;
    }

    public filterByKeys(keys: string[]): this {
        if (Array.isArray(this.data)) {
            this.data = this.data.map(item => {
                const filteredItem: any = {};
                keys.forEach(key => {
                    if (item.hasOwnProperty(key)) {
                        filteredItem[key] = item[key];
                    }
                });
                return filteredItem;
            });
            this.write();
        }
        return this;
    }

    public deleteIf(condition: (item: any) => boolean): this {
        if (Array.isArray(this.data)) {
            this.data = this.data.filter(item => !condition(item));
            this.write();
        }
        return this;
    }

    public mapEach(callback: (item: any, index: number, array: any[]) => any): this {
        if (Array.isArray(this.data)) {
            this.data = this.data.map(callback);
            this.write();
        }
        return this;
    }

    public filterEach(callback: (item: any, index: number, array: any[]) => boolean): this {
        if (Array.isArray(this.data)) {
            this.data = this.data.filter(callback);
            this.write();
        }
        return this;
    }

    public getCurrentData(): any {
        return this.data;
    }
}

```

### Documentation: JsonFileManager

#### Example Usage

```typescript
import { JsonFileManager } from './JsonFileManager';

// Initialize manager with a file path
const manager = new JsonFileManager('./data.json');

// Append a new item
manager.append({ id: 1, name: 'John Doe' });

// Filter objects by keys
manager.filterByKeys(['id']);

// Delete items that match a condition
manager.deleteIf(item => item.id === 1);

// Map each item to a new structure
manager.mapEach((item, index) => ({ ...item, index }));

// Filter each item based on a condition
manager.filterEach((item) => item.index > 0);

// Get the current data
const currentData = manager.getCurrentData();
console.log(currentData);
```

```ts
import { JsonFileManager } from './JsonFileManager';

// Initialize the manager with a file path
const manager = new JsonFileManager('./data.json');

// Append a new item to the JSON file
manager.append({ id: 1, name: 'Jane Doe' });

// Change the file path to a new JSON file and read its content
manager.setPath('./newData.json');

// Append another item to the new JSON file
manager.append({ id: 2, name: 'John Smith' });

// Filter the JSON array, retaining only specified keys
manager.filterByKeys(['name']);

// Delete items from the JSON array based on a condition
manager.deleteIf(item => item.name === 'John Smith');

// Transform each item in the JSON array
manager.mapEach((item, index) => ({ ...item, index: index + 1 }));

// Filter each item based on a condition
manager.filterEach(item => item.index > 1);

// Retrieve and log the current JSON data
const currentData = manager.getCurrentData();
console.log(currentData);

```
