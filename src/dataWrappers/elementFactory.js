import {isFunction} from "../utilities";


// also but some case specific helper functions for each style.

export default class ElementFactory{
    constructor(figure) {

        this.figure = figure;
        this.attrs={};
        this.interactions={};
        this.elementMaker=null;
        this.labelMaker=()=>"";

        return new Proxy(this,
            { get : function(target, prop)
                {
                    if(target[prop] === undefined){
                        return figure[prop].bind(figure);
                    }
                    else{
                        return target[prop];
                    }

                }
            });
    }

    elements(b=null) {
        if(b){
            this.elementMaker=b;
            if(this.figure.drawn){
                this.figure.update();
            }
            return this;
        }else{
            return this.elementMaker;
        }
    }


    attr(string, f) {
        if(f){
        this.attrs[string]=f;
        if(this.figure.drawn){
            this.figure.update();
        }
        return this;
        }
        else{
            return this.attrs[string];
        }
    }

    getAttrs(d){
        const attrs={};
        for(const [key,f] of Object.entries(this.attrs)){
            if (f instanceof Function) {
                    if (f(d)) {
                        attrs[key]=f(d);
                        }
            } else {
                        attrs[key]=f;
            }
        }
        return attrs;
    }
//TODO remove scales parameter. Only need it for branches and they  can get it from the figure.
    getElement(d,scales){
        let element=null;
        if(this.elementMaker) {
            if (!isFunction(this.elementMaker)) {
                element = new this.elementMaker()
            } else if (this.elementMaker instanceof Function) {
                const elementFactory = this.elementMaker(d);
                if (elementFactory) {
                    element = new elementFactory();
                }
            }
        }
        if(element){
            element.scales(scales);
            const attrs=this.getAttrs(d);
            for(const[key,value] of Object.entries(attrs)){
                element.attr(key,value);
            }
            for(const[key,f] of Object.entries(this.interactions)){
                element.on(key,f(element))
            }
            element.transitions(this.figure.transitions())
        }
        // set up scales in branch instance
            return element;
        }

        getLabel(d){
            if(this.labelMaker) {
                if (this.labelMaker instanceof Function) {
                        if (this.labelMaker(d)) {
                            return this.labelMaker(d)
                    }else{
                            return ""
                        }
                }else{
                        if(d[this.labelMaker]){
                            return d[this.labelMaker]
                        }else{
                            return "";
                    }
                }
            }
        }

    on(string,f=null){
        if(f) {
            this.interactions[string] = f;
            if (this.figure.drawn) {
                this.figure.update();
            }
            return this;
        }else{
            return this.interactions[string];
        }
    }

    label(l){
        if(l) {
            this.labelMaker = l;
            if(this.figure.drawn){
                this.figure.update();
            }
            return this;
        } else{
            return this.labelMaker;
        }
    }


}


