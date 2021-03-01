function search(q){
    var r = [];
document.cabs.forEach(cab =>{ 
    var items = [];
    var words = [];
    var f = false;
    words.push(String(cab.num));
    if (cab.teachers) items = items.concat(cab.teachers);
    items = items.concat(cab.titles);
    items.forEach(item=>words=words.concat(item.split()));
    for (let i=0; i<words.length; i++) {
        if (words[i].includes(q)) {
            f = true;
            break;
        }
    }
    if (f) r.push(cab)
})
return r;
}
