const cadenaCodificar = document.getElementById('cadena');
const iniciar = document.getElementById('start');
const codificado = document.getElementById('codificado');
const decodificado = document.getElementById('decodificado');
const leafSize = document.getElementById('leafSize');
const chartDom = document.getElementById("main");
const bitsAhorrados = document.getElementById("porcentajeAhorrado");
const promedioLongFreq = document.getElementById("promedioLongFreq")
let myChart = echarts.init(chartDom);

var el = document.querySelector('.odometer');

od = new Odometer({
    el: el,
    format: '',
    theme: 'default',
});

const colorLevels = {
    0: '#FF0059',
    100: '#E60050',
    200: '#CC0047',
    300: '#B3003E',
    400: '#990035',
    500: '#80002D',
    600: '#660024',
    700: '#4C001B',
    800: '#330012',
    900: '#190009',
    1000: '#000000'
}

let dictionary = [];

firstNodeSize = (n, m) => ((n - 1) % (m - 1)) + 1;

fixedLong = (a) => Math.round(Math.log(a));

createNode = (element = [], children = [], weight = 0) => {
    return Object.assign({
        name: element[0],
        weight,
        value: "",
        children,
        code: "",
        longitude: 0,
        longfreq: 0,
        freq: element[1],
        label: {},
    });
}

createFirstStepNode = (nodesArray, uniqueCharsLength, m) => {
    let weight = 0;
    let children = [];
    nodesArray.splice(0, firstNodeSize(uniqueCharsLength, m)).forEach((node) => {
        weight += node.weight;
        children.push(node);
    });
    return createNode([weight, 0], children, weight);
}

createHuffmanTree = (nodesArray, uniqueCharts, m = 1) => {
    if (m > 2) {
        nodesArray.push(createFirstStepNode(nodesArray, uniqueCharts.length, m));
        nodesArray.sort((a, b) => a.weight - b.weight);
    }

    while (nodesArray.length >= m) {
        let weight = 0;
        let children = [];
        nodesArray.splice(0, m).forEach((node) => {
            weight += node.weight;
            children.push(node);
        });
        nodesArray.push(createNode([weight, 0], children, weight));
        nodesArray.sort((a, b) => a.weight - b.weight);
    }

    nodesArray[0].label = {
        color: "white",
        backgroundColor: colorLevels[100]
    }

    return nodesArray[0];
}

assignValues = (node, parent) => {
    const dictionary = [];

    node.children.forEach((child, index) => {
        child.code = `${index}${parent ?? ""}`;
        child.longitude = child.code.length;
        child.value = child.freq;
        child.longfreq = child.longitude * child.freq;
        child.label = {
            color: "white",
            backgroundColor: colorLevels[child.code.length * 100]
        }
        if (child.children.length > 0) {
            child.name = `${index}${parent ?? ""}`;
            dictionary.push(...assignValues(child, child.code))
        } else {
            dictionary.push(child);
        }
    });

    return dictionary;
}

encryptString = (string, dictionary, spaceAllowed = false) => {
    let encrypted = " ";
    string
        .toUpperCase()
        .replaceAll(spaceAllowed ? "" : " ", "")
        .split("")
        .forEach((char) => {
            const codedChar = dictionary.find((c) => c.name === char);
            encrypted += `${codedChar.code} `;
        });

    return encrypted;
}

decryptString = (string, dictionary = false) => {
    let decrypted = "";
    let character = "";

    string.split("").forEach((code, index) => {
        character += code;
        const codedChar = dictionary.find((c) => {
            return c.code === character.trim();
        });
        if (codedChar) {
            if (string[index + 1] === " ") {
                decrypted += codedChar.name;
                character = "";
            }
        }
    });

    return decrypted;
}

createGraph = (huffmanTree) => {
    myChart.setOption(
        ({
            tooltip: {
                trigger: "item",
                triggerOn: "mousemove",
            },
            series: [
                {
                    type: "tree",
                    data: [huffmanTree],
                    left: "2%",
                    right: "2%",
                    initialTreeDepth: -1,
                    top: "8%",
                    bottom: "20%",
                    symbol: "rect",
                    orient: "vertical",
                    expandAndCollapse: true,
                    tooltip: {
                        formatter: '{b0}: {c0}'
                    },
                    label: {
                        padding: [10, 30],
                        position: "insideTop",
                        verticalAlign: "middle",
                        align: "center",
                        margin: [30, 30],
                        formatter: '{b0}',
                        fontSize: "16px",
                        fontWeight: "bold",
                    },
                    leaves: {
                        label: {
                            padding: [10, 30],
                            margin: [30, 30],
                            position: "insideTop",
                            formatter: '{b0}',
                            verticalAlign: "middle",
                            align: "center",
                            fontSize: "16px",
                            fontWeight: "bold",
                        },
                    },
                },
            ],
            animationEasing: 'elasticOut',
            animationDelayUpdate: function (idx) {
                return idx * 10;
            }
        })
    );
}

iniciar.addEventListener('click', () => {
    if(cadenaCodificar.value === "") {
        alert("La cadena a codificar no puede estar vacia.");
        return null;
    }
    let word = cadenaCodificar.value;
    let spaceAllowed = false;
    const charArray = spaceAllowed
        ? word.toUpperCase().split("")
        : word.toUpperCase().replaceAll(" ", "").split("");
    const m = leafSize.value;

    let nodesArray = [];
    let uniqueChars = Object.entries(
        charArray.reduce((group, char) => {
            group[char] = group[char] ? group[char] + 1 : 1;
            group[char] = group[char] + 1;
            return group;
        }, {})
    );

    uniqueChars
        .sort((a, b) => a[1] - b[1])
        .forEach((element) => {
            nodesArray.push(createNode(element));
        });

    const huffmanTree = createHuffmanTree(nodesArray, uniqueChars, m);
    dictionary = assignValues(huffmanTree);

    let freq = dictionary.reduce((sum, char) => {
        return char.freq + sum;
    }, 0);

    let longFreq = dictionary.reduce((sum, char) => {
        return char.longfreq + sum;
    }, 0);

    const averageLongFreq = longFreq / freq;
    promedioLongFreq.innerText = averageLongFreq;
    bitsAhorrados.innerText = `${Math.round((1 - averageLongFreq / 3) * 100)}%`;

    codificado.value = encryptString(word, dictionary, spaceAllowed)
    decodificado.value = decryptString(codificado.value, dictionary)

    createGraph(huffmanTree);
});

codificado.addEventListener('keyup', () => {
    decodificado.value = decryptString(codificado.value, dictionary);
});

window.addEventListener('resize', () => {
    myChart.resize();
});
