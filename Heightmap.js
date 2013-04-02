#pragma strict

private var INIT_UPDATE_TIME : float = 0.5;
private var DELTA_UPDATE_TIME : float = 1.0;
private var MIN_UPDATE_TIME : float = 0.001;

private var LEN : float = 5.0; // Plane length.
private var MAX_HEIGHT : float = 3.0;
private var MIN_HEIGHT : float = -3.0;

private var TRIANGLES_PER_VERTEX : int = 16; // Max number of neighbour triangles.

// Array management.
private var INIT_VERTICES_LEN : int = 4;
private var INIT_NUM_TRI_VERTICES : int = 6;
private var ARRAY_EXPAND_RATE : int = 2;
private var numVertices : int;
private var numTriVertices : int;

private var rand : Random;

private var mesh : Mesh;
private var meshVertices : Vector3[];
private var meshTriangles : int[];
private var newVertices : Vector3[];
private var vTriangles : Array;
//private var newTriangles : int[];

private var step : int;
private var updateTime : float; // sleep time between point insertions.


function Start() {
	rand = new Random();
	rand.seed = 1;

	updateTime = INIT_UPDATE_TIME;

	initMesh();

	step = 0;

	
	/*
	// Need to keep track of triangles that each vertex is part of.
	// Start by initializing our four initial points.
	vTriangles = new Array();
	for (var i = 0; i < mesh.vertices.length; i++) {
		vTriangles.Add(new int[NUM_TRIANGLES]);
	}
	*/

	/*
	// And then let them know which triangles they're in.
	for (i = 0; i < mesh.triangles.length; i++) {
		var triangle_index : int = i / 3;
		vTriangles[mesh.triangles[i]].Add(triangle_index);
	}
	*/

	

	StartCoroutine(updateMesh());
}

function Update() {
	
}

function initMesh() {
	mesh = GetComponent(MeshFilter).sharedMesh;
	mesh.Clear();

	//Set the initial four corner points.
	meshVertices = new Vector3[INIT_VERTICES_LEN];
	numVertices = 0;
	addVertex(Vector3(-LEN, 0, -LEN));
	addVertex(Vector3(-LEN, 0, LEN));
	addVertex(Vector3(LEN, 0, LEN));
	addVertex(Vector3(LEN, 0, -LEN));
	mesh.vertices = meshVertices;

	// Initial two-triangle composition for the mesh.
	meshTriangles = new int[INIT_NUM_TRI_VERTICES];
	meshTriangles[0] = 0;
	meshTriangles[1] = 1;
	meshTriangles[2] = 2;
	meshTriangles[3] = 2;
	meshTriangles[4] = 3;
	meshTriangles[5] = 0;
	numTriVertices = 2;
	mesh.triangles = meshTriangles;
	print("meshTriangles length: " + meshTriangles.length + 
		" numTriVertices: " + numTriVertices);

	/*

	// Initial two-triangle composition for the mesh.
	meshTriangles = new int[INIT_NUM_TRI_VERTICES];
	meshTriangles[0] = 0;
	meshTriangles[1] = 1;
	meshTriangles[2] = 2;
	meshTriangles[3] = 2;
	meshTriangles[4] = 3;
	meshTriangles[5] = 0;
	numTriVertices = 2;
	mesh.triangles = meshTriangles;
	print("meshTriangles length: " + meshTriangles.length + 
		" numTriVertices: " + numTriVertices);
	*/
	mesh.RecalculateNormals();
}

function addVertex(v : Vector3) {
	if (numVertices >= meshVertices.length) {
		// Need to increase the size.
		print("Expanding meshVertices...");
		var temp : Vector3[] = new Vector3[meshVertices.length * ARRAY_EXPAND_RATE];
		for (var i = 0; i < meshVertices.length; i++) {
			temp[i] = meshVertices[i];
		}
		meshVertices = temp;
	}
	
	meshVertices[numVertices] = v;
	numVertices++;

}

function updateMesh() {
	while(true) {
		// First four steps just set corner heights.
		if (step < 4) {
			// This should be done as the first pass.
			initCorners();
		}
		else {
			// normal case.
		}

		step++;


		updateTime *= DELTA_UPDATE_TIME;
		if (updateTime >= MIN_UPDATE_TIME)
			yield WaitForSeconds(updateTime);
		else
			yield;
	}
}

function initCorners() {
	// Debug.Log("initCorners\n");

	var mesh : Mesh = GetComponent(MeshFilter).mesh;
	
	var vertices : Vector3[] = mesh.vertices;
	var v:Vector3 = vertices[step];
	vertices[step] = new Vector3(v.x, getRand(), v.z);
	
	mesh.vertices = vertices;
	mesh.RecalculateNormals();
}

function getRand():float {
	return rand.Range(MIN_HEIGHT, MAX_HEIGHT);
}
