module.exports = (path, options) => {
    // Call the defaultResolver, so we leverage its cache, error handling, etc.
    return options.defaultResolver(path, {
        ...options,
        // Use packageFilter to process parsed `package.json` before the resolution
        packageFilter: (pkg) => {
            // Workaround for uuid ESM export issues
            if (pkg.name === 'uuid') {
                delete pkg['exports'];
                delete pkg['module'];
            }
            return pkg;
        },
    });
};
