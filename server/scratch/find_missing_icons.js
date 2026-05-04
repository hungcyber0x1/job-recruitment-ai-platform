const fs = require('fs');
const path = require('path');

function findMissingIcons(rootDir) {
  const iconUsageRe = /<([A-Z][a-zA-Z0-9]+)/g;
  const importRe = /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]lucide-react['"]/g;

  const results = {};
  const ignored = new Set([
    'React',
    'Fragment',
    'Card',
    'Button',
    'Badge',
    'Avatar',
    'Input',
    'Label',
    'Tabs',
    'Table',
    'Dialog',
    'DropdownMenu',
    'Popover',
    'Tooltip',
    'Select',
    'ScrollArea',
    'Separator',
    'Skeleton',
    'Switch',
    'Checkbox',
    'RadioGroup',
    'Slider',
    'Progress',
    'Calendar',
    'Accordion',
    'Alert',
    'AspectRatio',
    'Collapsible',
    'HoverCard',
    'NavigationMenu',
    'Resizable',
    'ScrollReveal',
    'AnimatedCounter',
    'AdminPageHeader',
    'PremiumStatCard',
    'ChartSurface',
    'AdminTable',
    'AnimatePresence',
    'Link',
    'XAxis',
    'YAxis',
    'CartesianGrid',
    'Tooltip',
    'Legend',
    'ResponsiveContainer',
    'AreaChart',
    'Area',
    'BarChart',
    'Bar',
    'LineChart',
    'Line',
    'PieChart',
    'Pie',
    'Cell',
    'Sector',
    'ComposedChart',
    'DropdownMenuContent',
    'DropdownMenuItem',
    'DropdownMenuTrigger',
    'DropdownMenuSeparator',
    'SelectContent',
    'SelectItem',
    'SelectTrigger',
    'SelectValue',
    'CardContent',
    'CardHeader',
    'CardTitle',
  ]);

  function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
          walk(fullPath);
        }
      } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');

        const imports = new Set();
        let match;
        while ((match = importRe.exec(content)) !== null) {
          const iconsStr = match[1];
          iconsStr.split(',').forEach((icon) => imports.add(icon.trim()));
        }

        const usages = new Set();
        let usageMatch;
        while ((usageMatch = iconUsageRe.exec(content)) !== null) {
          usages.add(usageMatch[1]);
        }

        const missing = [];
        for (const usage of usages) {
          if (!imports.has(usage) && !ignored.has(usage)) {
            // Check if it's imported from somewhere else
            const localImportRe = new RegExp(`import\\s+.*\\b${usage}\\b.*\\s+from`);
            const localConstRe = new RegExp(`const\\s+\\b${usage}\\b\\s*=`);
            if (!localImportRe.test(content) && !localConstRe.test(content)) {
              missing.push(usage);
            }
          }
        }

        if (missing.length > 0) {
          results[fullPath] = missing;
        }
      }
    }
  }

  walk(rootDir);
  return results;
}

const clientPath = path.join('d:', 'job-recruitment-ai-platform', 'client', 'src');
const missingData = findMissingIcons(clientPath);

for (const [filePath, icons] of Object.entries(missingData)) {
  console.log(`${filePath}: ${icons.join(', ')}`);
}
