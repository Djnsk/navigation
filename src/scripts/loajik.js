$.ajax({
	url: '/api/data/cabs/main.json',
	method: 'GET'
}).then(function (data) {
	document.cabs = data.cabs;

	$('#Poisk1').click(function(ev) {
		var q = $("#Search1").val()
		var r = search(q);
		showResults(r, 1);
	});

	$('#Poisk2').click(function(ev) {
		var q = $("#Search2").val()
		var r = search(q);
		showResults(r, 2);
	});

});


function showResults(data, id) {
	let $res = $('.query-results')[0];

	$(".floors").css("display", "none");
	$('.query-results')[0].innerHTML = '';
	$('.query-results').css('display', 'block');

	data.forEach(c => {
		$res.append(block(c));
	});

	function block(cab) {
		var mainBlock = document.createElement('div');
		mainBlock.classList.add('query-result');

		mainBlock.onclick = function (ev) {
			$(`#Search${id}`).val(cab.num);
			hideResults();
		};

		let teachers = cab.teachers? cab.teachers.join(', ') : '';
		let titles = cab.titles? cab.titles.join(', ') : '';

		mainBlock.innerHTML = `${cab.num}<br>${teachers}<br>${titles}`;
		return mainBlock;
	}
}

function hideResults() {
	$(".floors").css("display", "flex");
	$('.query-results')[0].innerHTML = '';
	$('.query-results').css('display', 'none');

	let s1 = $("#Search1").val();
	let s2 = $("#Search2").val();
	let p1, p2;

	for (let i = 1; i < 5; i++) {
		let t;

		t = MWP.floorPoints[i].find(x => x.name == s1);
		p1 = t? t : p1;
		t = MWP.floorPoints[i].find(x => x.name == s2);
		p2 = t? t : p2;

		if (p1 && p2) break;
	}

	if (p1 && p2) {
		MWP.cabQuery(s1, s2);
	}
}
