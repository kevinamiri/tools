Dealing with json file in Typescript

```typescript
import * as fs from 'fs';
import * as path from 'path';

class JsonFile {
  private filePath: string;

  constructor(initialPath: string) {
    this.filePath = path.resolve(initialPath);
    this.ensureFileExists();
  }

  private ensureFileExists(): void {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
    }
  }

  public setPath(newPath: string): void {
    this.filePath = path.resolve(newPath);
    this.ensureFileExists();
  }

  public read(): any {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading the file: ${error}`);
      return null;
    }
  }

  public write(data: any): boolean {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync(this.filePath, jsonData);
      return true;
    } catch (error) {
      console.error(`Error writing to the file: ${error}`);
      return false;
    }
  }

  public appendToArray(item: any): boolean {
    try {
      let data = this.read();
      if (!Array.isArray(data)) {
        console.error('The JSON file does not contain an array to append to.');
        return false;
      }
      data.push(item);
      this.write(data);
      return true;
    } catch (error) {
      console.error(`Error appending to the file: ${error}`);
      return false;
    }
  }

  public deleteFromArray(condition: (item: any) => boolean): boolean {
    try {
      let data = this.read();
      if (!Array.isArray(data)) {
        console.error('The JSON file does not contain an array to delete from.');
        return false;
      }
      const filteredData = data.filter(item => !condition(item));
      this.write(filteredData);
      return true;
    } catch (error) {
      console.error(`Error deleting from the file: ${error}`);
      return false;
    }
  }
}

// Example of Usage
// ----------------

// Initialize the JsonFile class with 'data.json'
const json = new JsonFile('data.json');

// Set a new path for the JSON file
json.setPath('./data2.json');

// Read and log the JSON data
const initialData = json.read();
console.log("Initial Data:", initialData);

// Write new JSON data
const newData = [{ key: 'value1' }, { key: 'value2' }];
json.write(newData);

// Append new data to the JSON array
const newItem = { key: 'value3' };
json.appendToArray(newItem);

// Read and log the JSON data after appending
const dataAfterAppend = json.read();
console.log("Data After Append:", dataAfterAppend);

// Delete an item from the JSON array based on a condition
json.deleteFromArray(item => item.key === 'value2');

// Read and log the JSON data after deleting
const dataAfterDelete = json.read();
console.log("Data After Delete:", dataAfterDelete);
```

### Example of Usage

1. **Initialize the Class**: Create a new instance of the `JsonFile` class, specifying the initial JSON file to work with.

    ```typescript
    const json = new JsonFile('data.json');
    ```

2. **Set a New Path**: Change the JSON file the class instance is working with.

    ```typescript
    json.setPath('./data2.json');
    ```

3. **Read Data**: Read and log the initial data from the JSON file.

    ```typescript
    const initialData = json.read();
    console.log("Initial Data:", initialData);
    ```

4. **Write Data**: Write an array of objects to the JSON file.

    ```typescript
    const newData = [{ key: 'value1' }, { key: 'value2' }];
    json.write(newData);
    ```

5. **Append Data**: Append a new object to the array in the JSON file.

    ```typescript
    const newItem = { key: 'value3' };
    json.appendToArray(newItem);
    ```

6. **Delete Data**: Delete an object from the array in the JSON file based on a condition.

    ```typescript
    json.deleteFromArray(item => item.key === 'value2');
    ```

7. **Read Modified Data**: Read and log the modified data from the JSON file.

    ```typescript
    const dataAfterDelete = json.read();
    console.log("Data After Delete:", dataAfterDelete);
    ```

This example demonstrates how to use the `JsonFile` class to perform various operations on a JSON file, all in a synchronous manner.
