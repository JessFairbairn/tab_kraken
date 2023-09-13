import {loadTemplates, TabItem} from "../page/TabItems.js"

describe("TabItem constructor", function(){
    beforeAll(loadTemplates)
    

    it("can handle Tab objects without a title property", async () => {
        const fakeTab = {
            url: "about:blank"
        }
        let newTabItem = new TabItem(fakeTab);
    });

    // it(
    //     "should be able to return a dictionary of all keys",
    //     () =>{
    //         counter.add("lol");
    //         expect(counter.getAll()).toEqual({"lol":1})
    //     }
    // );
});