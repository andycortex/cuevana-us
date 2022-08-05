function urlRouter(url, pages) {
    let expresion = /\/\d.*\//
    switch (true) {
        case url.includes("/category/"):
            return { url: url, userData: { label: "MAIN_CATEGORY", pages } };
            break;
        case url.match(expresion).length == 1:
            return { url: url, userData: { label: "DETAIL", pages } };
            break;
        default:
            break;
    }
}

exports.urlRouter = urlRouter;
