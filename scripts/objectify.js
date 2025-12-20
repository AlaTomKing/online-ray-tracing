// convert roblox properties of objects to javascript classes objects
// that i can read

export const runObjects = async (jsonPath) => {
    const materialArrays = [];
    const objects = [];

    let json;

    await fetch(jsonPath).then((response) => {
        if (!response.ok) {
            console.log("response not ok bruv; status: " + response.status);
        }
        return response.json();
    }).then((jsonContent) => {
        console.log("got json!");
        json = jsonContent;
    }).catch((error) => {
        console.log("response error ded ded: " + error.message);
    });

    json.forEach(part => {
        const materialTable = new Material();
        materialTable.color = new Color3(part.color[0], part.color[1], part.color[2]);
        materialTable.smoothness = part.reflectance;
        materialTable.emissionColor = new Color3(part.emissionColor[0], part.emissionColor[1], part.emissionColor[2]);
        materialTable.emissionStrength = part.emissionStrength;

        let i;

        let found = true;
        for (i = 0; i < materialArrays.length; i++) {
            let found1 = true;
            for (let j = 0; j < 8; j++) {
                if (materialTable[j] != materialArrays[i][j]) {
                    found1 = false; found = false; break;
                }
            }
            if (found1) break;
        }

        if (materialArrays.length == 0 || !found) {
            i = materialArrays.length;
            materialArrays.push(materialTable);
        }

        if (part.shape === "Ball") {
            const sphere = new Sphere();
            sphere.radius = part.size[0] / 2,
            sphere.position.set(part.cframe[0], part.cframe[1], part.cframe[2]);
            sphere.material = materialTable;
            objects.push(sphere);
        } else if (part.shape === "Block") {
            const block = new Block();
            block.setCFrame(new CFrame(part.cframe[0], part.cframe[1], part.cframe[2], part.cframe[3], part.cframe[4], part.cframe[5], part.cframe[6], part.cframe[7], part.cframe[8], part.cframe[9], part.cframe[10], part.cframe[11]));
            block.size.set(part.size[0], part.size[1], part.size[2]);
            block.material = materialTable;
            objects.push(block);
        }
    });

    //console.log(meshInfos, triangles)

    return objects;
}