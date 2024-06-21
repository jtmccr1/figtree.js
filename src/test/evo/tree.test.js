import { Tree } from "../../evo";

describe("tree ordering", () => {
  it("order", function () {
    const newickString = `((((((virus1:0.1,virus2:0.12):0.08,(virus3:0.011,virus4:0.0087):0.15):0.03,virus5:0.21):0.2,(virus6:0.45,virus7:0.4):0.02):0.1,virus8:0.4):0.1,(virus9:0.04,virus10:0.03):0.6);`;
    const orderedString =
      "((virus9:0.04,virus10:0.03):0.6,(virus8:0.4,((virus6:0.45,virus7:0.4):0.02,(virus5:0.21,((virus1:0.1,virus2:0.12):0.08,(virus3:0.011,virus4:0.0087):0.15):0.03):0.2):0.1):0.1);";

    const tree = Tree.parseNewick(newickString, { parseAnnotations: false });
    const orderedTree = tree.orderByNodeDensity(true);
    expect(orderedTree.toNewick()).toBe(orderedString);
  });

  it("reroot", function () {
    const tree = Tree.parseNewick("((A:1,B:1):1,C:2);");
    tree.reroot(tree.getExternalNode("A"), 0.5);
    expect(tree.toNewick()).toBe("(A:0.5,(B:1,C:3):0.5);");
  });
  it("bigger reroot - caused issues once", function () {
    const newickString = `((((((virus1:0.1,virus2:0.12):0.08,(virus3:0.011,virus4:0.0087):0.15):0.03,virus5:0.21):0.2,(virus6:0.45,virus7:0.4):0.02):0.1,virus8:0.4):0.1,(virus9:0.04,virus10:0.03):0.6);`;

    const tree = Tree.parseNewick(newickString);
    tree.reroot(tree.getExternalNode("virus3").parent, 0.5);
    expect(tree.toNewick()).toBe(
      "(((virus1:0.1,virus2:0.12):0.08,(virus5:0.21,((virus6:0.45,virus7:0.4):0.02,(virus8:0.4,(virus9:0.04,virus10:0.03):0.7):0.1):0.2):0.03):0.075,(virus3:0.011,virus4:0.0087):0.075);"
    );
  });
  it("rotate", function () {
    const tree = Tree.parseNewick("((A:1,B:1):1,C:2);");
    const node = tree.getExternalNode("A").parent;
    const child1 = node.children[0];
    node.rotate()
    const child2 = node.children[0];

    expect(child2.name).toBe("B");
    expect(child1.name).toBe("A");
  });
});

// describe("Tree operations",()=>{
//   it("nni",function(){
//       ex
//   })
// })

describe("Parsing", () => {
  it("simpleParse", function () {
    const newickString = `((((((virus1:0.1,virus2:0.12):0.08,(virus3:0.011,virus4:0.0087):0.15):0.03,virus5:0.21):0.2,(virus6:0.45,virus7:0.4):0.02):0.1,virus8:0.4):0.1,(virus9:0.04,virus10:0.03):0.6);`;

    const tree = Tree.parseNewick(newickString, {
      parseAnnotations: false,
      labelName: "probability",
    });
    expect(tree.toNewick()).toEqual(newickString);
  });

  it("height", function () {
    const newickString = `((((((virus1:0.1,virus2:0.12):0.08,(virus3:0.011,virus4:0.0087):0.15):0.03,virus5:0.21):0.2,(virus6:0.45,virus7:0.4):0.02):0.1,virus8:0.4):0.1,(virus9:0.04,virus10:0.03):0.6);`;
    const tree = Tree.parseNewick(newickString, { labelName: "prob" });

    const virus1Node = tree.getExternalNode("virus1");
    expect(virus1Node.height).toBeCloseTo(0.06, 1e-6);
  });
  it("divergence", function () {
    const newickString = `((((((virus1:0.1,virus2:0.12):0.08,(virus3:0.011,virus4:0.0087):0.15):0.03,virus5:0.21):0.2,(virus6:0.45,virus7:0.4):0.02):0.1,virus8:0.4):0.1,(virus9:0.04,virus10:0.03):0.6);`;
    const tree = Tree.parseNewick(newickString, { labelName: "prob" });

    const virus6Node = tree.getExternalNode("virus6");
    expect(virus6Node.divergence).toBeCloseTo(0.67, 1e-6);
  });
  it("general_parse", function () {
    const tree = Tree.parseNewick("(a:1,b:4)#l;");
    const root = tree.root;
    const label = root.label;
    expect(label).toEqual("l");

    const r = tree.getInternalNode("l");
    expect(r).toEqual(root);

    const names = [];
    const bl = [];

    const rootLength = root.length;
    if (rootLength) {
      bl.push(tree.getLength(root));
    }
    for (const child of root.children) {
      names.push(child.name);
      bl.push(child.length);
    }
    expect(names).toEqual(["a", "b"]);

    expect(bl).toEqual([1, 4]);
  });

  it("scientific notation", function () {
    const tree = Tree.parseNewick("(a:1E1,b:2e-5);");
    const root = tree.root;
    const bl = [];
    const rootLength = root.length;
    if (rootLength) {
      bl.push(tree.getLength(root));
    }
    for (const child of root.children) {
      bl.push(child.length);
    }
    expect(bl[0]).toBeCloseTo(10.0, 1e-6);
    expect(bl[1]).toBeCloseTo(0.00002, 1e-6);
  });

  it("quoted taxa", function () {
    const tree = Tree.parseNewick("('234] ':1,'here a *':1);");
    const names = tree.externalNodes.map((node) =>
      node.name
    );
    expect(names).toEqual(["234]", "here a *"]);
  });

  it("whitespace", function () {
    const tree = Tree.parseNewick("  (a,b:1);\t");
    expect(tree.toNewick()).toEqual("(a,b:1);");
  });
  it("node id", function () {
    const tree = Tree.parseNewick("((A,T)#Node_1:1,(a,b:1));");

    const node1 = tree.getInternalNode("Node_1");
    const parent = node1.parent;

    expect(parent).toEqual(tree.root);

    expect(tree.toNewick()).toEqual("((A,T)#Node_1:1,(a,b:1));");
  });
  it("root length and label", function () {
    const tree = Tree.parseNewick("((A,T)#Node_1:1,(a,b:1))#root:0.1;");
    const root = tree.root;
    const rootLength = root.length;
    expect(rootLength).toEqual(0.1);
    const label = root.label;
    expect(label).toEqual("root");
    expect(tree.toNewick()).toEqual("((A,T)#Node_1:1,(a,b:1))#root:0.1;");
  });

//   it("fail no ;", function () {
//     expect(() => Tree.parseNewick("('234] ','here a *')")).toThrow(
//       "expecting a semi-colon at the end of the newick string"
//     );
//   });

  it("fail unbalanced )", function () {
    expect(() => Tree.parseNewick("(a,b));")).toThrow(
      "the brackets in the newick file are not balanced: too many closed"
    );
  });

  it("fail unbalanced (", function () {
    expect(() => Tree.parseNewick("((a,b);")).toThrow(
      "the brackets in the newick file are not balanced: too many opened"
    );
  });

  it("comment", function () {
    const tree = Tree.parseNewick("(a[&test=ok],b:1);", {
      parseAnnotations: true,
    });
    const a = tree.getExternalNode("a");
    const testAnnotation = a.annotations["test"];
    expect(testAnnotation).toEqual("ok");
  });

  it("markov jump comment", function () {
    const tree = Tree.parseNewick(
      "(a[&test=ok],b[&jump={{0.1,U,me}}]);",
      { parseAnnotations: true }
    );
    const a = tree.getExternalNode("a");
    const b = tree.getExternalNode("b");
    const testAnnotation = a.annotations["test"];
    expect(testAnnotation).toEqual("ok");
    const jumpAnnotation = b.annotations["jump"];
    expect(jumpAnnotation).toEqual(["0.1","U","me"]);
  });

  it("double comment", function () {
    const tree = Tree.parseNewick("(a[&test=ok,other test = 1],b:1);", {
      parseAnnotations: true,
    });
    const a = tree.getExternalNode("a");
    const testAnnotation = a.annotations["test"];
    expect(testAnnotation).toEqual("ok");
    const otherTestAnnotation = a.annotations["other test"];
    expect(otherTestAnnotation).toEqual(1);
  });

  it("label annotation", function () {
    const tree = Tree.parseNewick(
      "((((((virus1:0.1,virus2:0.12)0.95:0.08,(virus3:0.011,virus4:0.0087)1.0:0.15)0.65:0.03,virus5:0.21)1.0:0.2,(virus6:0.45,virus7:0.4)0.51:0.02)1.0:0.1,virus8:0.4)1.0:0.1,(virus9:0.04,virus10:0.03)1.0:0.6);",
      { parseAnnotations: true, labelName: "probability" }
    );

    const virus1Node = tree.getExternalNode("virus1");
    const probability = 
      virus1Node.parent.annotations["probability"]

    expect(probability).toEqual(0.95);
  });
});
