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

private var INIT_UPDATE_TIME : float = 1.5;
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
	//rand.seed = 1;

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
	addVertex(Vector3(-LEN, 0, -LEN));
	addVertex(Vector3(-LEN, 0, LEN));
	addVertex(Vector3(LEN, 0, LEN));
	addVertex(Vector3(LEN, 0, -LEN));
	mesh.vertices = meshVertices;

	// Initial two-triangle composition for the mesh.
	meshTriangles = new int[INIT_NUM_TRI_VERTICES];
	numTriVertices = 0;
	addTriangle(0, 1, 2);
	addTriangle(2, 3, 0);
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

function midpoint(t0 : int, t1 : int) {
	// Find the four corners of the two input triangles, and return
	// the midpoint (vector3). Assumes t0 and t1 share an edge.
	
	// Get the four corners.
	var corner : int;
	var corners = {};
	var cornerVertices = new Vector3[4];
	var ci = 0;
	for (var i = 0; i < 3; i++) {
		corner = meshTriangles[t0*3 + i];
		if (corner not in corners) {
			corners[corner] = meshVertices[corner];
			cornerVertices[ci++] = meshVertices[corner];
		}

		corner = meshTriangles[t1*3 + i];
		if (corner not in corners) {
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
		/* Do I even need this?
		// First pass looks for triangles in orientations [0:3]
		var orientedTriangles : int[] = vTriangles[i];
		var vo = new int[4]; // Vertex orientations.

		for (j = 0; j < orientedTriangles.length; j++) {
			//print(meshVertices[i].ToString + " " + orientedTriangles[j]);
			if (orientedTriangles[j] != -1) {
				print("Found triangle with orientation " + j +
					" at point " + meshVertices[i].ToString());
				vo[j] = 1;
			}
		}

		if (vo[TRI_0] && vo[TRI_1]) {

			splitTrianglePair(i, meshVertices[i], TRI_0, orientedTriangles[TRI_0],
				TRI_1, orientedTriangles[TRI_1]);
			// mesh.RecalculateNormals();	
		}
		if (vo[TRI_2] && vo[TRI_3]) {
			splitTrianglePair(i, meshVertices[i], TRI_2, orientedTriangles[TRI_2],
				TRI_3, orientedTriangles[TRI_3]);
			// mesh.RecalculateNormals();	
		}
		*/
		if (vTriangles[i][TRI_0] != -1 && vTriangles[i][TRI_1] != -1) {
			pp = midpoint(vTriangles[i][TRI_0], vTriangles[i][TRI_1]);
			p = addVertex(pp);
			splitTriangle(i, meshVertices[i], TRI_0, vTriangles[i][TRI_0], p);
			splitTriangle(i, meshVertices[i], TRI_1, vTriangles[i][TRI_1], p);
			// splitTrianglePair(i, meshVertices[i], TRI_0, vTriangles[i][TRI_0],
			// 	TRI_1, vTriangles[i][TRI_1]);
		}
		if (vTriangles[i][TRI_2] != -1 && vTriangles[i][TRI_3] != -1) {
			pp = midpoint(vTriangles[i][TRI_2], vTriangles[i][TRI_3]);
			p = addVertex(pp);
			splitTriangle(i, meshVertices[i], TRI_2, vTriangles[i][TRI_2], p);
			splitTriangle(i, meshVertices[i], TRI_3, vTriangles[i][TRI_3], p);
			// splitTrianglePair(i, meshVertices[i], TRI_2, vTriangles[i][TRI_2],
			// 	TRI_3, vTriangles[i][TRI_3]);
		}

	}

	// SQUARE STEP.

	// Need to loop through the vertices added in the diamond step.
	var numVerticesAdded = numVertices - numVerticesAtStart;
	// Added vertices always in a square -> sqrt for side length.
	var n = Mathf.Sqrt(numVerticesAdded);
	var v1 : int;
	var v2 : int;

	for (i = 0; i < numVerticesAdded; i++) {
		v1 = numVerticesAtStart + i;

		// Do the [4, 7] orientation pair.
		if (i < n*(n-1)) { // Not bottom row.
			v2 = numVerticesAtStart + (i + n);
		}
		else { // Bottom row.
			v2 = numVerticesAtStart + (i - n*(n-1));
		}
		//splitTriangle(v1, meshVertices[v1], TRI_7, vTriangles[v1][TRI_7]);

		// Do the [5, 6] orientation pair.
		if (i % n == n-1) { // Right edge.

		}
				
	}		

	pass++;
	noise *= DELTA_RAND;		
	
	}
}

function splitTriangle(a : int, pa : Vector3, o : int, tri_id : int, p : int) {
	// Splits a triangle at a specific point.

	// Get all our triangle points.
	var points = secondaryPoints(tri_id, a);
	var b = points[0];
	var c = points[1];
	var pb = meshVertices[b];
	var pc = meshVertices[c];

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
	// TODO: I don't think my secondaryPoints is robust enough to know
	// ordering of a,b,c...
}


function splitTrianglePair(a : int, pa : Vector3, o1 : int, tri_id1 : int, 
	o2 : int, tri_id2 : int) {
	// print("Splitting triangle pair...");
	
	// Get our points down.
	var b : int;
	var c : int;
	var pb : Vector3;
	var pc : Vector3;

	// General use vars.
	// var temp_v3 : Vector3;
	// var temp_v_id : int;
	var p_id : int;

	var p : Vector3 = new Vector3(); // The new point that we're adding.

	if (o1 < 4 && o2 < 4) {
		// Not sure if this should be the first thing I do, but
		// need to remove the references to these triangles-to-split
		// from the source point (a).
		vTriangles[a][o1] = -1;
		vTriangles[a][o2] = -1;

		// SPLIT THE FIRST TRIANGLE.

		var points = secondaryPoints(tri_id1, a);
		b = points[0];
		c = points[1];
		pb = meshVertices[b];
		pc = meshVertices[c];

		// print(pb.x + " " + pa.x + " " + pb.z + " " + pa.z);
		p.x = (pb.x - pa.x) / 2.0 + pa.x;
		p.z = (pb.z - pa.z) / 2.0 + pa.z;
		p.y = (pb.y - pa.y) / 2.0 + pa.y + getRand();

		// Remove the old triangle.
		meshTriangles[tri_id1 * 3] = 0;
		meshTriangles[(tri_id1 * 3) + 1] = 0;
		meshTriangles[(tri_id1 * 3) + 2] = 0;

		p_id = addVertex(p);
		addTriangle(a, p_id, c);
		addTriangle(p_id, b, c);

		// SPLIT THE SECOND TRIANGLE
		points = secondaryPoints(tri_id2, a);
		b = points[0];
		c = points[1];
		pb = meshVertices[b];
		pc = meshVertices[c];

		if (o2 < 4) {
			// Remove the old triangle.
			meshTriangles[tri_id2 * 3] = 0;
			meshTriangles[(tri_id2 * 3) + 1] = 0;
			meshTriangles[(tri_id2 * 3) + 2] = 0;

			addTriangle(a, c, p_id);
			addTriangle(p_id, c, b);
		}
	}
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
	if (pb.x == pa.x || pb.z == pa.z) {
		var temp_v_id = b;
		b = c;
		c = temp_v_id;
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
