const fs = require('fs');

const deptHtml = fs.readFileSync('departments.html', 'utf8');
const deptMatches = [...deptHtml.matchAll(/id="dept-([^"]+)"[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<p class="dept-lead-text">([^<]+)<\/p>/g)];

console.log('--- Departments ---');
deptMatches.forEach(m => {
    console.log({ id: m[1], name: m[2].trim(), leadText: m[3].trim() });
});

const councilHtml = fs.readFileSync('council.html', 'utf8');
const memberMatches = [...councilHtml.matchAll(/class="council-card[^"]*"[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<p class="council-role">([^<]+)<\/p>/g)];

console.log('\n--- Council Members Count ---', memberMatches.length);
