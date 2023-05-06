export default class StringCounter {
    constructor() {
        this._counts = {};
    }

    add(stringValue) {
        if(this._counts[stringValue]) {
            this._counts[stringValue]++;
        } else{
            this._counts[stringValue] = 1;
        }
    }

    get(stringValue) {
        return this._counts[stringValue]
    }

    getAll() {
        return this._counts;
    }

    getAllOrdered() {
        let countDict = this._counts;
        let itemList =  Object.keys(countDict).map(function(key) {
            return [key, countDict[key]];
        });

        itemList.sort((a, b) => a[1] - b[1]);
        
        itemList.reverse();

        return itemList;
    }

    getResultsWithMin(min=1) {
        let filtered = Object.fromEntries(Object.entries(this._counts).filter(([k,v]) => v>=min));
        return filtered;
    }
}

