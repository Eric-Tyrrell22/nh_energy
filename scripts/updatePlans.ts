import getSupplierInfo from '../data-updater/api/index';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async() => {
  const filePath = path.resolve(__dirname, '..', 'frontend', 'public', 'data', 'supplier_data.json');
  const supplierInfo = await getSupplierInfo();
  if (supplierInfo) {
    console.log(JSON.stringify(supplierInfo, null, 2));
    const jsonData = JSON.stringify(supplierInfo, null, 2);

    fs.writeFileSync(filePath, jsonData, 'utf8');
    console.log(`Supplier information successfully written synchronously to: ${filePath}`);
  } else {
    console.log("Failed to retrieve supplier information.");
  }
})();
