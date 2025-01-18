const isValidRegex = (regex: string): boolean => {
    try {
        new RegExp(regex);
        return true;
    } catch (e) {
        console.error("Error validating regex", e);
        return false;
    }
}

export { isValidRegex };