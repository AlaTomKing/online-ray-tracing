imma use a gpu library that allows me to run gpu things on a gpu so i dont need to write another shading language that i am not familiar with

### okay this is for me:

```
* position is in arrays

meshInfos contains meshInfo
triangles contains actually every value of each triangle together

- sphere: these motherfuckers actually dont have any triangles at all
    0. positionX (num)
    1. positionY (num)
    2. positionZ (num)
    3. radius (num)
    4. material (num)

- meshInfo:
    0. numTriangles (num)
    1. material (num)

- material:
    0. colorX (num)
    1. colorY (num)
    2. colorZ (num)
    3. emissionColorX (num)
    4. emissionColorY (num)
    5. emissionColorZ (num)
    6. emissionStrength (num)
    7. smoothness (num)

- triangle:
    0. posA (arr)
    1. posB (arr)
    3. posB (arr)
    4. normalB (arr)
    5. normalB (arr)
    6. normalB (arr)
```

gl (good luck)!