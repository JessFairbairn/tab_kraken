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

    getResultsWithMin(min=1) {
        let filtered = Object.fromEntries(Object.entries(this._counts).filter(([k,v]) => v>=min));
        return filtered;
    }
}

