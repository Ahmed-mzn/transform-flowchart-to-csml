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
            text: ""
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
        const node4 = this.addNodeWithCoordinates(SayTextNode, 1000, 60);
        const node5 = this.addNodeWithCoordinates(SayTextNode, 1000, 240);
        const node6 = this.addNodeWithCoordinates(SayTextNode, 1000, 440);

        const node7 = this.addNodeWithCoordinates(SwitchNode, 1300, 60);
        node7.setOptionValue("Cases number", 2);
        const node8 = this.addNodeWithCoordinates(SayTextNode, 1600, 440);
        const node9 = this.addNodeWithCoordinates(SayTextNode, 1600, 240);
        node3.setOptionValue("Cases number", 3);

        this.editor.addConnection(node1.getInterface("Next"), node2.getInterface("input"));
        this.editor.addConnection(node2.getInterface("Next"), node3.getInterface("input"));
        this.editor.addConnection(node3.getInterface("Case 1"), node4.getInterface("input"));
        this.editor.addConnection(node3.getInterface("Case 2"), node5.getInterface("input"));
        this.editor.addConnection(node3.getInterface("Case 3"), node6.getInterface("input"));

        this.editor.addConnection(node4.getInterface("Next"), node7.getInterface("input"));
        this.editor.addConnection(node7.getInterface("Case 2"), node8.getInterface("input"));
        this.editor.addConnection(node7.getInterface("Case 1"), node9.getInterface("input"));

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

            // let nodesLen = cms.nodes.length;
            // for(let i=0; i<nodesLen; i++){
            //     if(cms.nodes[i].type == "StartNode"){
            //         this.text += `say "${cms.nodes[i].options[0][1]}"\n`;
            //     }

            //     if(cms.nodes[i].type == "SayTextNode"){
            //         this.text += `say "${cms.nodes[i].options[0][1]}"\nhold \n`;
            //     }

            //     if(cms.nodes[i].type == "SwitchNode"){
            //         // this.handleSwitch(cms.nodes[i]);
            //     }
            // }
        },
        algo(cms){
            console.log("-algo start");
            let startNodeCount = 0, stop = 1, loop = 1;

            let currentNode, currentNodeId, csml = [];

            // get startNode
            for(let i=0; i<cms.nodes.length; i++){
                if(cms.nodes[i].type == "StartNode"){
                    startNodeCount++;
                    currentNode = cms.nodes[i];
                    csml.push(currentNode);
                }
            }
            
            currentNodeId = this.getConnectionToId(cms.connections, currentNode.interfaces[0][1].id);

            this.text += "start:\n";

            if(startNodeCount != 1){
                alert("must conatins one startNode")
            } else {
                while(currentNode){
                    stop = 1;
                    loop++;
                    if(currentNode.type != "SwitchNode"){
                        for(let i=0; i<cms.nodes.length; i++){
                            if(cms.nodes[i].type != "StartNode"){
                                if(cms.nodes[i].interfaces[0][1].id == currentNodeId){
                                    this.text += `say "${currentNode.options[0][1]}"\n`;
                                    console.log(`say "${currentNode.options[0][1]}"\n`);
                                    csml.push(cms.nodes[i]);
                                    currentNode = cms.nodes[i];
                                    if(cms.nodes[i].type != "SwitchNode"){
                                        currentNodeId = this.getConnectionToId(cms.connections, cms.nodes[i].interfaces[1][1].id);
                                    } else{
                                        currentNodeId = null;
                                    }
                                    stop = 0;
                                }
                            }
                        }
                    } else {
                        this.text += "remeber input = event\n";
                        stop = 1;
                        let result = this.handleSwitch(currentNode, cms.nodes, cms.connections);
                        console.log(result);
                        
                        currentNodeId = this.getConnectionToId(cms.connections, result[result.length-1].interfaces[1][1].id);
                        for(let i=0; i<result.length; i++){
                            this.text += `if( input ${this.getSwitchNodeOperation(currentNode.options[0][1])} ${currentNode.options[i+2][1]} ){ \n`;
                            let caseBody = this.handleCase(cms.nodes, cms.connections, result[i]);
                            console.log(caseBody);
                            // let check = 1;
                            // for(let j=0; j<caseBody.length; j++){
                            //     if(caseBody[j].type == "SwitchNode"){
                            //         check = 0;
                            //     }
                            // }
                            for(let j=0; j<caseBody.length; j++){
                                // if(caseBody[j].type == "SayTextNode" && check == 1){
                                //     this.text += `say "${caseBody[j].options[0][1]}"\n`;
                                //     console.log(`say "${caseBody[j].options[0][1]}"\n`)
                                // }
                                csml.push(caseBody[j]);
                            }
                            this.text += "}\n";
                        }
                        currentNode = null
                        // csml.push(result);
                        // console.log(result);
                    }
                    if(stop == 1 || loop == cms.nodes.length){
                        currentNode = null;
                    }
                }
            }
            console.log(csml);
            console.log("-algo end");
        },
        handleCase(nodes, connections, caseNode){
            let result = [], stop = 1, loop = 1, currentNode = caseNode, currentNodeId = this.getConnectionToId(connections, currentNode.interfaces[1][1].id);
            // console.log(currentNodeId);
            // console.log("case");
            result.push(currentNode);
            while(currentNode){
                stop = 1;
                // console.log(currentNode);
                if(currentNode.type != "SwitchNode"){
                    this.text += `say "${currentNode.options[0][1]}"\n`;
                    console.log(`say "${currentNode.options[0][1]}"\n`)
                    for(let i=0; i<nodes.length; i++){
                        if(nodes[i].interfaces[0][1].id == currentNodeId){
                            result.push(nodes[i]);
                            currentNode = nodes[i];
                            // currentNodeId = this.getConnectionToId(connections, nodes[i].interfaces[1][1].id);
                            if(nodes[i].type != "SwitchNode"){
                                currentNodeId = this.getConnectionToId(connections, nodes[i].interfaces[1][1].id);
                            } else{
                                currentNodeId = null;
                            }
                            // console.log(currentNode);
                            // console.log(currentNodeId);
                            stop = 0;
                        }
                    }                    
                } else {
                    stop = 1;
                    // console.log("switch case");
                    let result2 = this.handleSwitch(currentNode, nodes, connections);
                    
                    currentNodeId = this.getConnectionToId(connections, result2[result2.length-1].interfaces[1][1].id);
                    for(let i=0; i<result2.length; i++){
                        this.text += `if( input ${this.getSwitchNodeOperation(currentNode.options[0][1])} ${currentNode.options[i+2][1]} ){ \n`;
                        let caseBody = this.handleCase(nodes, connections, result2[i]);
                        // console.log(caseBody);
                        // let check = 1;
                        // for(let j=0; j<caseBody.length; j++){
                        //     if(caseBody[j].type == "SwitchNode"){
                        //         check = 0;
                        //     }
                        // }
                        for(let j=0; j<caseBody.length; j++){
                            // if(caseBody[j].type == "SayTextNode"){
                            //     this.text += `say "${caseBody[j].options[0][1]}"\n`;
                            //     console.log(`say "${caseBody[j].options[0][1]}"\n`)
                            // }
                            result.push(caseBody[j]);
                        }
                        this.text += "}\n";
                    }
                    currentNode = null
                }
                if(stop == 1 || loop == nodes.length){
                    currentNode = null;
                }
            }
            return result;
        },
        handleSwitch(switchNode, nodes, connections){
            let result = [];
            for(let i=1; i<switchNode.interfaces.length; i++){
                let connectionToId = this.getConnectionToId(connections, switchNode.interfaces[i][1].id);
                let caseNode = this.getNodeByConnectionId(connectionToId, nodes);
                result.push(caseNode);
            }
            return result;
        },
        getNodeByConnectionId(id, nodes){
            for(let i=0; i<nodes.length; i++){
                if(nodes[i].interfaces[0][1].id == id){
                    return nodes[i];
                }
            }
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
            this.text = "";
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