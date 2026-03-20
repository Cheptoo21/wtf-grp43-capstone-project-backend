export const normalizeItem = (item) => {
    if (!item) return ""

    let name = item.toLowerCase().trim();
    const noiseWords = [
        "bag", "bags", "bottle", "bottles", "carton", "cartons", "cup", "cups", "of", "pack", "packs", "kilogram", "kilo", "gram", "litre", "litres", "loaf", "loaves", "piece", "pieces"
    ]
    noiseWords.forEach(word => {
        name = name.replace(new RegExp(`\\b${word}\\b`, "g"), "")
    });

    return name.replace(/\s+/g, " ").trim();
}