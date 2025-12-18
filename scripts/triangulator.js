// tringalingaling

// convert roblox properties of objects to shader properties of objects
// that the shader can read

// creates triangle but no smoothing though
export const runTriangulator = async (jsonPath) => {
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

    console.log(json)

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
            sphere.position.set(part.cframe[0], part.cframe[1], part.cframe[2])
            sphere.material = materialTable
            objects.push(sphere);
        } else if (part.shape === "Block") {
            const frontNormal = new Vector3(part.cframe[9], part.cframe[10], part.cframe[11]);
            const upNormal = new Vector3(part.cframe[6], part.cframe[7], part.cframe[8]);
            const rightNormal = new Vector3(part.cframe[3], part.cframe[4], part.cframe[5]);

            const front = frontNormal.mul(part.size[2]).div(2);
            const up = upNormal.mul(part.size[1]).div(2);
            const right = rightNormal.mul(part.size[0]).div(2);

            const a = new Vector3(part.cframe[0], part.cframe[1], part.cframe[2]).add(up).add(front).sub(right);
            const b = new Vector3(part.cframe[0], part.cframe[1], part.cframe[2]).add(up).add(front).add(right);
            const c = new Vector3(part.cframe[0], part.cframe[1], part.cframe[2]).add(up).sub(front).sub(right);
            const d = new Vector3(part.cframe[0], part.cframe[1], part.cframe[2]).add(up).sub(front).add(right);
            const e = new Vector3(part.cframe[0], part.cframe[1], part.cframe[2]).sub(up).add(front).sub(right);
            const f = new Vector3(part.cframe[0], part.cframe[1], part.cframe[2]).sub(up).add(front).add(right);
            const g = new Vector3(part.cframe[0], part.cframe[1], part.cframe[2]).sub(up).sub(front).sub(right);
            const h = new Vector3(part.cframe[0], part.cframe[1], part.cframe[2]).sub(up).sub(front).add(right);

            const meshInfo = [,12,i]

            //TOP NORMAL: ABC, BCD
            insertTable(triangles, Triangle_flat(a, c, b, upNormal));
            insertTable(triangles, Triangle_flat(b, c, d, upNormal));

            //BOTTOM NORMAL: EFG, FGH
            insertTable(triangles, Triangle_flat(e, f, g, upNormal.neg()));
            insertTable(triangles, Triangle_flat(f, h, g, upNormal.neg()));

            //FRONT NORMAL: ABE, BEF
            insertTable(triangles, Triangle_flat(a, b, e, frontNormal));
            insertTable(triangles, Triangle_flat(b, f, e, frontNormal));

            //BACK NORMAL: CDG, DGH
            insertTable(triangles, Triangle_flat(c, g, d, frontNormal.neg()));
            insertTable(triangles, Triangle_flat(d, g, h, frontNormal.neg()));

            //LEFT NORMAL: ACE, CEG
            insertTable(triangles, Triangle_flat(a, e, c, rightNormal.neg()));
            insertTable(triangles, Triangle_flat(c, e, g, rightNormal.neg()));

            //RIGHT NORMAL: BDF, DFH
            insertTable(triangles, Triangle_flat(b, d, f, rightNormal));
            insertTable(triangles, Triangle_flat(d, h, f, rightNormal));

            insertTable(meshInfos, meshInfo);
        }
    });

    return objects;
}