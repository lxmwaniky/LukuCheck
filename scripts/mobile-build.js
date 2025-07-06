const fs = require('fs');
const path = require('path');

const adminRoutePath = path.join(process.cwd(), 'src/app/(app)/admin');
const tempPath = path.join(process.cwd(), 'temp_admin_backup');

function temporarilyRemoveAdmin() {
  if (fs.existsSync(adminRoutePath)) {
    fs.renameSync(adminRoutePath, tempPath);
    console.log('Admin routes temporarily moved for mobile build');
  }
}

function restoreAdmin() {
  if (fs.existsSync(tempPath)) {
    fs.renameSync(tempPath, adminRoutePath);
    console.log('Admin routes restored');
  }
}

const action = process.argv[2];
if (action === 'disable') {
  temporarilyRemoveAdmin();
} else if (action === 'restore') {
  restoreAdmin();
}