<template>
    <div style="height: 100vh; width: 100vw">
        <button @click="save()">save</button>
        <button @click="chowText()">show</button>
        <hint-overlay />
        <baklava-editor :plugin="viewPlugin" />
    </div>
</template>

<script>
import HintOverlay from "./HintOverlay.vue";
import { Editor } from "@baklavajs/core";
import { ViewPlugin } from "@baklavajs/plugin-renderer-vue";
import { OptionPlugin } from "@baklavajs/plugin-options-vue";
import { Engine } from "@baklavajs/plugin-engine";
// import { MathNode } from "./MathNode";
// import { DisplayNode } from "./DisplayNode";
import { SayTextNode } from "./SayTextNode";
import { StartNode } from "./StartNode";
import { SwitchNode } from "./SwitchNode";

export default {
    components: { HintOverlay },
    data() {
        return {
            editor: new Editor(),
            viewPlugin: new ViewPlugin(),
            engine: new Engine(true),
            text: "start: \n"
        };
    },
    created() {
        // Register the plugins
        // The view plugin is used for rendering the nodes
        this.editor.use(this.viewPlugin);
        // The option plugin provides some default option UI elements
        this.editor.use(new OptionPlugin());
        // The engine plugin calculates the nodes in the graph in the
        // correct order using the "calculate" methods of the nodes
        this.editor.use(this.engine);

        // Show a minimap in the top right corner
        this.viewPlugin.enableMinimap = true;

        // register the nodes we have defined, so they can be
        // added by the user as well as saved & loaded.
        // this.editor.registerNodeType("MathNode", MathNode);
        // this.editor.registerNodeType("DisplayNode", DisplayNode);
        this.editor.registerNodeType("SayTextNode", SayTextNode);
        this.editor.registerNodeType("StartNode", StartNode);
        this.editor.registerNodeType("SwitchNode", SwitchNode);

        // add some nodes so the screen is not empty on startup
        const node1 = this.addNodeWithCoordinates(StartNode, 100, 140);
        const node2 = this.addNodeWithCoordinates(SayTextNode, 400, 140);
        const node3 = this.addNodeWithCoordinates(SwitchNode, 700, 140);
        this.editor.addConnection(node1.getInterface("Next"), node2.getInterface("input"));
        this.editor.addConnection(node2.getInterface("Next"), node3.getInterface("input"));
        this.engine.calculate();
    },
    methods: {
        addNodeWithCoordinates(nodeType, x, y) {
            const n = new nodeType();
            this.editor.addNode(n);
            n.position.x = x;
            n.position.y = y;
            return n;
        },
        save(){
            let cms = this.editor.save();
            console.log(cms);
            this.algo(cms);

            let nodesLen = cms.nodes.length;
            for(let i=0; i<nodesLen; i++){
                if(cms.nodes[i].type == "StartNode"){
                    this.text += `say "${cms.nodes[i].options[0][1]}"\n`;
                }

                if(cms.nodes[i].type == "SayTextNode"){
                    this.text += `say "${cms.nodes[i].options[0][1]}"\nhold \n`;
                }

                if(cms.nodes[i].type == "SwitchNode"){
                    this.handleSwitch(cms.nodes[i]);
                }
            }
        },
        algo(cms){
            console.log("-algo start");
            let startNodeCount = 0;

            let currentNode, currenNodeId, csml = [];

            for(let i=0; i<cms.nodes.length; i++){
                if(cms.nodes[i].type == "StartNode"){
                    startNodeCount++;
                    currentNode = cms.nodes[i];
                    // currenNodeId = currentNode.interfaces[0][1].id;
                    csml.push(currentNode);
                }
            }

            currenNodeId = this.getConnectionToId(cms.connections, currentNode.interfaces[0][1].id);

            if(startNodeCount != 1){
                alert("must conatins one startNode")
            } else {
                while(currentNode){
                    // console.log(currentNode);
                    // console.log("current node id"+"  - "+currenNodeId);
                    if(currentNode.type != "SwitchNode"){
                        let stop = 1;
                        for(let i=0; i<cms.nodes.length; i++){
                            if(cms.nodes[i].type != "StartNode"){
                                // console.log(cms.nodes[i].interfaces[0][1].id);
                                if(cms.nodes[i].interfaces[0][1].id == currenNodeId){
                                    csml.push(cms.nodes[i]);
                                    currentNode = cms.nodes[i];
                                    currenNodeId = this.getConnectionToId(cms.connections, cms.nodes[i].interfaces[1][1].id);
                                    stop = 0;
                                }
                            }
                        }
                    } else {
                        let cases = currentNode;
                    }
                    if(stop == 1){
                        currentNode = null;
                    }
                }
            }
            console.log(csml);
            console.log("-algo end");
        },
        getConnectionToId(connections, id){
            let result;
            for(let i=0; i<connections.length; i++){
                if(connections[i].from == id){
                    result = connections[i].to;
                }
            }
            return result;
        },
        chowText(){
            console.log(this.text);
            this.text = "start: \n";
        },
        handleSwitch(switchNode){
            this.text += "remember input = event \n"
            let switchLen = switchNode.options.length;

            let op = this.getSwitchNodeOperation(switchNode.options[0][1]);

            for(let j=2; j<switchLen; j++){
                this.text += `if( input ${op} ${switchNode.options[j][1]} ){ \n`;
            }
        },
        getSwitchBody(){
            
        },
        getSwitchNodeOperation(op){
            if(op == "Equals"){
                return "==";
            }

            if(op == "Not Equals"){
                return "!=";
            }

            if(op == "Contains"){
                return "contains";
            }
        }
    }
};
</script>