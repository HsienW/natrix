const Map = function (mapSize) {
    this.mapSize = mapSize;
}

Map.prototype.getMapSize = function () {
    return this.mapSize;
}

const map = new Map(41);
const mapSize = map.getMapSize();

export {
    map,
    mapSize
}
