import { Node } from "@baklavajs/core";

export class SwitchNode extends Node {
    constructor() {
        super();
        this.type = "SwitchNode";
        this.name = "SwitchNode";
        this.cases = 0;
        this.addInputInterface("input")
        this.addOption("Operation", "SelectOption", "Equals", undefined, {
            items: ["Equals", "Not Equals", "Contains"]
        });
        this.addOption("Cases number", "IntegerOption", 1, undefined, {min:1});
        this.addOption("Case 1", "InputOption", "");
        this.addOutputInterface("Case 1");


        this.events.update.addListener(this, (p) => {
            if(p.name == "Cases number" && p.option.optionComponent == "IntegerOption"){
                if(p.option.value >= 0){

                    for(let i=1; i<=this.cases; i++){
                        this.removeOption("Case "+i);
                        this.removeInterface("Case "+i);
                    }
                    this.cases = 0;

                    for(let i=1; i<=p.option.value; i++){
                        this.addOption("Case "+i, "InputOption", "");
                        this.addOutputInterface("Case "+i);
                        this.cases++;
                    }
                    if(p.option.value < 0){
                        this.setOptionValue("Cases number", 0);
                    }
                }
            }
        });
    }
}
