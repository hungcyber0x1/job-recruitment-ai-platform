import os
import re

def find_missing_icons(root_dir):
    icon_usage_re = re.compile(r'<([A-Z][a-zA-Z0-9]+)')
    import_re = re.compile(r'import\s+\{\s*([^}]+)\s*\}\s+from\s+[\'"]lucide-react[\'"]')
    
    results = {}

    for root, dirs, files in os.walk(root_dir):
        # Skip node_modules and other irrelevant dirs
        if 'node_modules' in root or '.git' in root or '.next' in root:
            continue
            
        for file in files:
            if file.endswith('.jsx') or file.endswith('.tsx'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                        # Find all imported icons
                        imports = set()
                        for match in import_re.finditer(content):
                            icons_str = match.group(1)
                            # Split by comma and clean up
                            for icon in icons_str.split(','):
                                imports.add(icon.strip())
                        
                        # Find all used icons (PascalCase tags)
                        # We try to filter out components that are NOT icons by checking lucide-react docs or just common prefixes
                        # But simpler is to check if it's used as <IconName /> or <IconName>
                        usages = set(icon_usage_re.findall(content))
                        
                        # Common non-icon components to ignore
                        ignored = {'React', 'Fragment', 'Card', 'Button', 'Badge', 'Avatar', 'Input', 'Label', 'Tabs', 'Table', 'Dialog', 'DropdownMenu', 'Popover', 'Tooltip', 'Select', 'ScrollArea', 'Separator', 'Skeleton', 'Switch', 'Checkbox', 'RadioGroup', 'Slider', 'Progress', 'Calendar', 'Accordion', 'Alert', 'AspectRatio', 'Collapsible', 'HoverCard', 'NavigationMenu', 'Resizable', 'ScrollReveal', 'AnimatedCounter', 'AdminPageHeader', 'PremiumStatCard', 'ChartSurface', 'AdminTable', 'AnimatePresence', 'Link'}
                        
                        missing = []
                        for usage in usages:
                            if usage not in imports and usage not in ignored:
                                # This might be a missing icon or a local component
                                # We'll do a second pass: if it's imported from somewhere else, ignore it
                                local_import_re = re.compile(rf'import\s+.*{usage}.*\s+from')
                                if not local_import_re.search(content):
                                    missing.append(usage)
                        
                        if missing:
                            results[path] = missing
                except Exception as e:
                    print(f"Error reading {path}: {e}")
                    
    return results

if __name__ == "__main__":
    missing_data = find_missing_icons('d:/job-recruitment-ai-platform/client/src')
    for path, icons in missing_data.items():
        print(f"{path}: {', '.join(icons)}")
