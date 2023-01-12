import StringCounter from "../js_utils/StringCounter.js";

describe("StringCounter", function(){
    let counter;
    beforeEach(()=> counter = new StringCounter())
    

    it("should count", () => {
        counter.add("lol")
        expect(counter.get("lol")).toBe(1)
    });

    it(
        "should be able to return a dictionary of all keys",
        () =>{
            counter.add("lol");
            expect(counter.getAll()).toEqual({"lol":1})
        }
    );
});

describe("StringCounter.getResultsWithMin", () => {
    let counter;
    beforeEach(()=> counter = new StringCounter())

    it("should be able to filter results by min number of results", () => {
        counter.add("foo");
        counter.add("foo");
        counter.add("bar");

        let results = counter.getResultsWithMin(2);
        expect(results).toEqual({"foo":2});
    });
});