import getSupplierInfo from './api/index';

(async() => {
  const supplierInfo = await getSupplierInfo();
  if (supplierInfo) {
    console.log(JSON.stringify(supplierInfo, null, 2));
  } else {
    console.log("Failed to retrieve supplier information.");
  }
})();
