
var tok = { type: 'keyword', length: 7 },
    max_line_length = 6,
    prev_token = { type: "keyword" };

out: {
    if (tok.length > max_line_length) {
        if (prev_token) {
            if (prev_token.type == "keyword") break out;
        }
        switch (tok.type) {
            case "keyword":
            case "atom":
            case "name":
            case "punc":
                console.log(tok);
                break out;
        }
    }
}
