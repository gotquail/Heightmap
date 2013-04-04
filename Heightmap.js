#pragma strict

import System.Collections.Generic;

private var TRI_0 : int = 0;
private var TRI_1 : int = 1;
private var TRI_2 : int = 2;
private var TRI_3 : int = 3;
private var TRI_4 : int = 4;
private var TRI_5 : int = 5;
private var TRI_6 : int = 6;
private var TRI_7 : int = 7;

private var INIT_UPDATE_TIME : float = 0.0;
private var DELTA_UPDATE_TIME : float = 1.0;
private var MIN_UPDATE_TIME : float = 0.001;

private var LEN : float = 5.0; // Plane length.
private var MAX_HEIGHT : float = 10.0;
private var MIN_HEIGHT : float = -10.0;
private var INIT_RAND : float = MAX_HEIGHT * 0.75;
private var DELTA_RAND : float = 0.6;

private var ORIENTATIONS_PER_VERTEX : int = 8; // Max number of neighbour triangles.

// Array management.
private var INIT_VERTICES_LEN : int = 4;
private var INIT_NUM_TRI_VERTICES : int = 6;
private var ARRAY_EXPAND_RATE : int = 2;
private var numVertices : int;
private var numTriVertices : int;


// Mesh components.
private var mesh : Mesh;
private var meshVertices : Vector3[];
private var meshTriangles : int[];
private var newVertices : Vector3[];
private var vTriangles : Dictionary.<int, int[]>;

private var rand : Random;
private var pass : int;
private var noise : float;  
private var updateTime : float; // sleep time between point insertions.



function Start() {
	// testTriangleOrientation();

	rand = new Random();
	rand.seed = 1;

	updateTime = INIT_UPDATE_TIME;

	initMesh();

	pass = 0;
	noise = INIT_RAND;

	StartCoroutine(updateMesh());
}

function Update() {
	
}

function initMesh() {
	mesh = GetComponent(MeshFilter).sharedMesh;
	mesh.Clear();

	//Set the initial four corner points.
	meshVertices = new Vector3[INIT_VERTICES_LEN];
	vTriangles = new Dictionary.<int, int[]>();
	numVertices = 0;
	// addVertex(Vector3(-LEN, 0, -LEN));
	// addVertex(Vector3(-LEN, 0, LEN));
	// addVertex(Vector3(LEN, 0, LEN));
	// addVertex(Vector3(LEN, 0, -LEN));
	addVertex(Vector3(-LEN, 0, LEN));
	addVertex(Vector3(LEN, 0, LEN));
	addVertex(Vector3(-LEN, 0, -LEN));
	addVertex(Vector3(LEN, 0, -LEN));

	mesh.vertices = meshVertices;

	// Initial two-triangle composition for the mesh.
	meshTriangles = new int[INIT_NUM_TRI_VERTICES];
	numTriVertices = 0;
	addTriangle(0, 1, 3);
	addTriangle(0, 3, 2);
	mesh.triangles = meshTriangles;

	mesh.RecalculateNormals();
}

function addVertex(v : Vector3) : int{
	if (numVertices >= meshVertices.length) {
		// Need to increase the size.
		print("Expanding meshVertices: old size: " + meshVertices.length +
			" new size: " + meshVertices.length * ARRAY_EXPAND_RATE);
		var temp : Vector3[] = new Vector3[meshVertices.length * ARRAY_EXPAND_RATE];
		for (var i = 0; i < meshVertices.length; i++) {
			temp[i] = meshVertices[i];
		}
		meshVertices = temp;
	}

	meshVertices[numVertices] = v;

	// Also init the vertex in vTriangles.
	vTriangles[numVertices] = new int[ORIENTATIONS_PER_VERTEX];
	print("adding vertex #" + numVertices);
	// Init to -1.
	for (i = 0; i < ORIENTATIONS_PER_VERTEX; i++) {
		vTriangles[numVertices][i] = -1;
	}

	numVertices++;

	mesh.vertices = meshVertices;

	return numVertices - 1;
}

function addTriangle(a : int, b : int, c : int) {
	if (numTriVertices >= meshTriangles.length) {
		// Need to increase the size.
		print("Expanding meshTriangles: numTriVertices: " + numTriVertices +
			" meshTriangles.length: " + meshTriangles.length + 
			" old size: " + meshTriangles.length + " new size: " + 
			meshTriangles.length * ARRAY_EXPAND_RATE);
		var temp : int[] = new int[meshTriangles.length * ARRAY_EXPAND_RATE];
		for (var i = 0; i < meshTriangles.length; i++) {
			temp[i] = meshTriangles[i];
		}
		meshTriangles = temp;
	}
	// print("Adding triangle: " + a + " " + b + " " + c);
	recordTriangleOrientations(a, b, c);

	meshTriangles[numTriVertices++] = a;
	meshTriangles[numTriVertices++] = b;
	meshTriangles[numTriVertices++] = c;

	mesh.triangles = meshTriangles;
}

function recordTriangleOrientations(a : int, b : int, c : int) {
	var va : Vector3 = meshVertices[a];
	var vb : Vector3 = meshVertices[b];
	var vc : Vector3 = meshVertices[c];

	var orientation : int;

	orientation = triangleOrientation(va, vb, vc);
	if (orientation != -1)
		vTriangles[a][orientation] = numTriVertices / 3;

	orientation = triangleOrientation(vb, vc, va);
	if (orientation != -1)
		vTriangles[b][orientation] = numTriVertices / 3;

	orientation = triangleOrientation(vc, va, vb);
	if (orientation != -1)
		vTriangles[c][orientation] = numTriVertices / 3;


}

function triangleOrientation(a : Vector3, b : Vector3, c : Vector3) : int {
	// Vertex 'a' always taken to be the reference centre.
	
	// 1, 2
	if (b.x == a.x) {
		if (b.z < a.z && b.z == c.z) {
			if (c.x < b.x) {
				return TRI_1;
			}
			if (c.x > b.x) {
				return TRI_2;
			}
		}
	}
	if (c.x == a.x) {
		if (c.z < a.z && c.z == b.z) {
			if (b.x < c.x) {
				return TRI_1;
			}
			if (b.x > c.x) {
				return TRI_2;
			}
		}
	}

	// 0, 3
	if (b.z == a.z) {
		if (c.z < b.z && c.x == b.x) {
			if (b.x < a.x) {
				return TRI_0;
			}
			if (b.x > a.x) {
				return TRI_3;
			}
		}
	}
	if (c.z == a.z) {
		if (b.z < c.z && b.x == c.x) {
			if (c.x < a.x) {
				return TRI_0;
			}
			if (c.x > a.x) {
				return TRI_3;
			}
		}
	}

	// 5, 6
	if (b.x == c.x) {
		if ((b.z > a.z && c.z < a.z) ||
			(b.z < a.z && c.z > a.z)) {
			if (b.x < a.x && c.x < a.x) {
				return TRI_5;
			}
			if (b.x > a.x && c.x > a.x) {
				return TRI_6;
			}
		}
	}

	// 4, 7
	if (b.z == c.z) {
		if ((b.x > a.x && c.x < a.x) ||
			(b.x < a.x && c.x > a.x)) {
			if (b.z > a.z && c.z > a.z) {
				return TRI_4;
			}
			if (b.z < a.z && c.z < a.z) {
				return TRI_7;
			}		
		}
	}

	return -1;
}

/*
function testTriangleOrientation() {
	print("testtriorient");

	var a : Vector3 = new Vector3(0, 0, 0);
	var c : Vector3 = new Vector3(-1, 0, -1);
	var b : Vector3 = new Vector3(1, 0, -1);

	print(a.ToString());
	print(b.ToString());
	print(c.ToString());
	print("Orientation: " + triangleOrientation(a, c, b) + "\n");

}
*/

function midpoint1(a : int, t : int) {
	// a is the home vertex, and the midpoint will be on the opposite edge.
	// print("single triangle midpoint");

	var points = secondaryPoints(t, a);
	var b = points[0];
	var c = points[1];
	var pa = meshVertices[a];
	var pb = meshVertices[b];
	var pc = meshVertices[c];
	// print("Points in midpoint1: ");
	// print(pa.ToString());
	// print(pb.ToString());
	// print(pc.ToString());

	// Calculate average coords.
	var tx : float = (pb.x + pc.x) / 2.0;
	var ty : float = (pb.y + pc.y + pa.y) / 3.0; // point a matters for height avg, just not pos.
	var tz : float = (pb.z + pc.z) / 2.0;

	// y (height) is offset by noise factor.
	ty += getRand();

	// print("New point from midpoint1: " + (new Vector3(tx, ty, tz)).ToString());
	return new Vector3(tx, ty, tz);

}

function printTriangle(t : int) {
	// Debugging helper.
	var v = new Vector3[3];
	for (var i = 0; i < 3; i++) {
		v[i] = meshVertices[meshTriangles[t*3 + i]];
	}
	print("Triangle " + t + " " + v[0].ToString() + " " +
		v[1].ToString() + " " + v[2].ToString());
}

function midpoint2(t0 : int, t1 : int) {
	// Find the four corners of the two input triangles, and return
	// the midpoint (vector3). Assumes t0 and t1 share an edge.
	
	// Debug.
	// print("midpoint2 call: t0: " + t0 + " t1: " + t1);
	// printTriangle(t0);
	// printTriangle(t1);

	// Get the four corners.
	var corner : int;
	var corners = {};
	var cornerVertices = new Vector3[4];
	var ci = 0;
	for (var i = 0; i < 3; i++) {
		corner = meshTriangles[t0*3 + i];
		if (corner not in corners) {
			// print("Adding corner from t0: " + 
			// 	(meshTriangles[corner]).ToString());
			corners[corner] = meshVertices[corner];
			cornerVertices[ci++] = meshVertices[corner];
		}

		corner = meshTriangles[t1*3 + i];
		if (corner not in corners) {
			// print("Adding corner from t1: " + 
			// 	(meshTriangles[corner]).ToString());
			corners[corner] = meshVertices[corner];
			cornerVertices[ci++] = meshVertices[corner];
		}
	}

	// Calculate average coords.
	var tx : float = 0.0;
	var ty : float = 0.0;
	var tz : float = 0.0;
	for (i = 0; i < 4; i++) {
		// print("corner " + i + ": " + cornerVertices[i].ToString());
		tx += cornerVertices[i].x;
		ty += cornerVertices[i].y;
		tz += cornerVertices[i].z;
	}

	tx /= 4.0;
	ty /= 4.0;
	tz /= 4.0;

	// y (height) is offset by noise factor.
	ty += getRand();

	return new Vector3(tx, ty, tz);
}

function updateMesh() {

	while(true) {
	
	yield StartCoroutine(yieldWrapper());
	// if (pass < 4)
	// 	initCorners();

	var i : int;
	var j : int;
	var p : int; // Id of new point.
	var pp : Vector3; // Location of new point.

	// DIAMOND STEP.
	var numVerticesAtStart = numVertices;
	for (i = 0; i < numVerticesAtStart; i++) {
		if (vTriangles[i][TRI_0] != -1 && vTriangles[i][TRI_1] != -1) {
			pp = midpoint2(vTriangles[i][TRI_0], vTriangles[i][TRI_1]);
			p = addVertex(pp);
			splitTriangle(i, meshVertices[i], TRI_0, vTriangles[i][TRI_0], p);
			splitTriangle(i, meshVertices[i], TRI_1, vTriangles[i][TRI_1], p);
			yield StartCoroutine(yieldWrapper());
		}
		if (vTriangles[i][TRI_2] != -1 && vTriangles[i][TRI_3] != -1) {
			pp = midpoint2(vTriangles[i][TRI_2], vTriangles[i][TRI_3]);
			p = addVertex(pp);
			splitTriangle(i, meshVertices[i], TRI_2, vTriangles[i][TRI_2], p);
			splitTriangle(i, meshVertices[i], TRI_3, vTriangles[i][TRI_3], p);
			yield StartCoroutine(yieldWrapper());
		}
	}
	// SQUARE STEP.

	// Need to loop through the vertices added in the diamond step.
	var numVerticesAdded = numVertices - numVerticesAtStart;
	// Added vertices always in a square -> sqrt for side length.
	var n = Mathf.Sqrt(numVerticesAdded);
	var v1 : int;
	var v2 : int;

	// If we wrap around, a second point will be added.
	var p2 : int;
	var pp2 : Vector3;

	for (i = 0; i < numVerticesAdded; i++) {
		v1 = numVerticesAtStart + i;

		// Do the [4, 7] orientation pair.
		if (i < n*(n-1)) { // Not bottom row.
			v2 = numVerticesAtStart + (i + n);
			pp = midpoint2(vTriangles[v1][TRI_7], vTriangles[v2][TRI_4]);
			p = addVertex(pp);
			splitTriangle(v1, meshVertices[v1], TRI_7, vTriangles[v1][TRI_7], p);
			splitTriangle(v2, meshVertices[v2], TRI_4, vTriangles[v2][TRI_4], p);
			yield StartCoroutine(yieldWrapper());
		}
		else { // Bottom row -> have to wrap around.
			v2 = numVerticesAtStart + (i - n*(n-1));
			pp = midpoint1(v1, vTriangles[v1][TRI_7]);
			p = addVertex(pp);
			splitTriangle(v1, meshVertices[v1], TRI_7, vTriangles[v1][TRI_7], p);
			pp2 = midpoint1(v2, vTriangles[v2][TRI_4]);
			p2 = addVertex(pp2);
			splitTriangle(v2, meshVertices[v2], TRI_4, vTriangles[v2][TRI_4], p2);
			yield StartCoroutine(yieldWrapper());
		}


		// Do the [5, 6] orientation pair.
		if (i % n != n-1) { // Not right edge.
			v2 = numVerticesAtStart + (i + 1);
			pp = midpoint2(vTriangles[v1][TRI_6], vTriangles[v2][TRI_5]);
			p = addVertex(pp);
			splitTriangle(v1, meshVertices[v1], TRI_6, vTriangles[v1][TRI_6], p);
			splitTriangle(v2, meshVertices[v2], TRI_5, vTriangles[v2][TRI_5], p);
			yield StartCoroutine(yieldWrapper());
		}
		else { // Right edge -> have to wrap around to get the left-edge triangle.
			v2 = numVerticesAtStart + (i - (n-1));
			pp = midpoint1(v1, vTriangles[v1][TRI_6]);
			p = addVertex(pp);
			splitTriangle(v1, meshVertices[v1], TRI_6, vTriangles[v1][TRI_6], p);
			pp2 = midpoint1(v2, vTriangles[v2][TRI_5]);
			p2 = addVertex(pp2);
			splitTriangle(v2, meshVertices[v2], TRI_5, vTriangles[v2][TRI_5], p2);	
			yield StartCoroutine(yieldWrapper());
		}
				
	}

	// After every round we need to rebuild, to maintain the ordering
	// of the vertices.
	rebuildMesh();
	print("REBUILD COMPLETE!");
	mesh.RecalculateNormals();
	yield StartCoroutine(yieldWrapper());
	yield StartCoroutine(yieldWrapper());

	// Debuggin.
	if (pass == 4) {
		print("exiting after pass " + pass);
		return;
	}


	pass++;
	noise *= DELTA_RAND;		
	
	}
}


function printArrayVec3(a : Vector3[]) {
	for (var i = 0; i < a.length; i++) {
		print(a[i].ToString());
	}
}

function compareVector3(a : Vector3, b : Vector3) {
	if (a.x == b.x && a.z == b.z)
		return 0;
	
	if (a.z > b.z)
		return -1;
	if (a.z < b.z)
		return 1;

	if (a.x < b.x)
		return -1;
	else
		return 1;
}

function mergesortVector3(a : Vector3[]) : void {
	// print("TESTING MERGESORT");

	if (a.length == 1)
		return;

	var halfLen = a.length / 2;

	var sub0 : Vector3[] = new Vector3[halfLen];
	for (var i = 0; i < halfLen; i++) {
		sub0[i] = a[i];
	}
	mergesortVector3(sub0);

	var sub1 : Vector3[] = new Vector3[a.length - halfLen];
	for (i = halfLen; i < a.length; i++) {
		sub1[i - halfLen] = a[i];
	}
	mergesortVector3(sub1);

	// Now combine the two sorted sub lists into a.
	i = 0;
	var j = 0;
	var k = 0;
	var res : int;
	while (j < sub0.length || k < sub1.length) {
		// If one sublist is empty, default to the other.
		if (j == sub0.length) {
			a[i++] = sub1[k++];
			continue;
		}
		else if (k == sub1.length) {
			a[i++] = sub0[j++];
			continue;			
		}

		// Otherwise, find the max of the next two.
		res = compareVector3(sub0[j], sub1[k]);
		// print("compared " + sub0[j].ToString() + " to " + 
		// 	sub1[k].ToString() + " result: " + res);

		if (res < 0) {
			a[i++] = sub0[j++];
		}
		else if (res > 0) {
			a[i++] = sub1[k++];
		}
	}

}

function rebuildMesh() {
	// points to old vertex id
	var d1 : Dictionary.<Vector3, int> = new Dictionary.<Vector3, int>();
	
	var sortedVertices : Vector3[] = new Vector3[numVertices];
	for (var i = 0; i < numVertices; i++) {
		sortedVertices[i] = meshVertices[i];
		d1[meshVertices[i]] = i;
	}

	mergesortVector3(sortedVertices);
	mesh.vertices = sortedVertices;

	// points to new vertex id (from sorted)
	var d2 : Dictionary.<Vector3, int> = new Dictionary.<Vector3, int>();
	for (i = 0; i < numVertices; i++) {
		d2[sortedVertices[i]] = i;
	}

	// Rebuild triangles.
	var v : Vector3;
	for (i = 0; i < numTriVertices; i++) {
		v = meshVertices[meshTriangles[i]];
		meshTriangles[i] = d2[v];
	}
	mesh.triangles = meshTriangles;

	// Rebuild orientation lists.
	var tempvTriangles = new Dictionary.<int, int[]>();
	var old_index : int;
	for (i = 0; i < numVertices; i++) {
		old_index = d1[sortedVertices[i]];
		tempvTriangles[i] = vTriangles[old_index];
	}
	vTriangles = tempvTriangles;

	meshVertices = sortedVertices;
}

function splitTriangle(a : int, pa : Vector3, o : int, tri_id : int, p : int) {
	// Splits a triangle at a specific point.

	// Get all our triangle points.
	var points = secondaryPoints(tri_id, a);
	var b = points[0];
	var c = points[1];
	var pb = meshVertices[b];
	var pc = meshVertices[c];

	// print("Splitting triangle:\n" + meshVertices[a].ToString() + "\n" + 
	// 	pb.ToString() + "\n" + pc.ToString());

	// Remove reference to the original triangle.
	vTriangles[a][o] = -1;
	
	// Zero-out the original triangle (removes from mesh, ineffeciently).
	meshTriangles[tri_id*3] = 0;
	meshTriangles[tri_id*3 + 1] = 0;
	meshTriangles[tri_id*3 + 2] = 0;

	if (o == TRI_0 || o == TRI_2) {
		addTriangle(a, p, c);
		addTriangle(p, b, c);
	}
	else if (o == TRI_1 || o == TRI_3) {
		addTriangle(a, c, p);
		addTriangle(p, c, b);
	}
	else if (o == TRI_4 || o == TRI_5 || o == TRI_6 || o == TRI_7) {
		addTriangle(a, b, p);
		addTriangle(a, p, c);
	}
	else {
		print("ERROR: Couldn't add the triangle...");
	}

	mesh.RecalculateNormals();

	// TODO: I don't think my secondaryPoints is robust enough to know
	// ordering of a,b,c...
}

function secondaryPoints(tri_id : int, primary : int) {
	var a : int = primary;
	var b : int;
	var c : int;

	if (meshTriangles[tri_id * 3] == a) {
		b = meshTriangles[tri_id * 3 + 1];
		c = meshTriangles[tri_id * 3 + 2];
	}
	else if (meshTriangles[tri_id * 3 + 1] == a) {
		b = meshTriangles[tri_id * 3];
		c = meshTriangles[tri_id * 3 + 2];
	}
	else {
		b = meshTriangles[tri_id * 3];
		c = meshTriangles[tri_id * 3 + 1];
	}

	// Make sure pb is the point on the far side of diagonal.
	var pa : Vector3 = meshVertices[a];
	var pb : Vector3 = meshVertices[b];
	var pc : Vector3 = meshVertices[c];

	var temp_v_id : int;
	// Orientations [0:3]
	if (pb.x == pa.x || pb.z == pa.z) {
		temp_v_id = b;
		b = c;
		c = temp_v_id;
	}
	else if (pc.x == pa.x || pc.z == pa.z) {
		;
	}
	// Orientations [4:7]
	else {
		if (pb.x == pc.x) {
			if (pb.x < pa.x) { // 5
				if (pb.z > pc.z) {
					temp_v_id = b;
					b = c;
					c = temp_v_id;
				}
			}
			else if (pb.x > pa.x) { // 6
				if (pb.z < pc.z) {
					temp_v_id = b;
					b = c;
					c = temp_v_id;
				}
			}
		}
		else if (pb.z == pc.z) { // 4, 7
			if (pb.z > pa.z) { // 4
				if (pb.x > pc.x) {
					temp_v_id = b;
					b = c;
					c = temp_v_id;	
				}
			}
			else if (pb.z < pa.z) { // 7
				if (pb.x < pc.x) {
					temp_v_id = b;
					b = c;
					c = temp_v_id;
				}
			}
		}
	}

	return [b, c];
}

function yieldWrapper() {
	if (updateTime >= MIN_UPDATE_TIME) {
		updateTime *= DELTA_UPDATE_TIME;
		yield WaitForSeconds(updateTime);
	}
	else {
		yield;
	}
}

function initCorners() {
	// Debug.Log("initCorners\n");

	var mesh : Mesh = GetComponent(MeshFilter).mesh;
	
	var vertices : Vector3[] = mesh.vertices;
	var v:Vector3 = vertices[pass];
	vertices[pass] = new Vector3(v.x, getRand(), v.z);
	
	mesh.vertices = vertices;
	mesh.RecalculateNormals();
}

function getRand():float {
	return rand.Range(0, noise) - (noise / 2.0);
	// return rand.Range(0, noise); // Only positive growth.
	// return rand.Range(MIN_HEIGHT, MAX_HEIGHT);
}
