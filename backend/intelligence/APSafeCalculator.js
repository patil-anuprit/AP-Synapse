function tokenize(expression) {
    const compact =
        String(expression || "")
            .replace(/\s+/g, "");

    if (!compact) {
        throw new Error(
            "Empty expression."
        );
    }

    const tokens =
        compact.match(
            /\d+(?:\.\d+)?|[()+\-*/]/g
        );

    if (
        !tokens ||
        tokens.join("") !==
            compact
    ) {
        throw new Error(
            "Unsupported calculator expression."
        );
    }

    return tokens;
}

const precedence = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2
};

function toRpn(tokens) {
    const output = [];
    const operators = [];

    let previous =
        "start";

    for (
        let index = 0;
        index < tokens.length;
        index += 1
    ) {
        const token =
            tokens[index];

        if (
            /^\d/.test(token)
        ) {
            output.push(
                Number(token)
            );

            previous =
                "number";

            continue;
        }

        if (
            token === "("
        ) {
            operators.push(token);

            previous =
                "open";

            continue;
        }

        if (
            token === ")"
        ) {
            while (
                operators.length &&
                operators[
                    operators.length - 1
                ] !== "("
            ) {
                output.push(
                    operators.pop()
                );
            }

            if (
                operators.pop() !==
                "("
            ) {
                throw new Error(
                    "Mismatched parentheses."
                );
            }

            previous =
                "close";

            continue;
        }

        if (
            token === "-" &&
            (
                previous === "start" ||
                previous === "operator" ||
                previous === "open"
            )
        ) {
            output.push(0);
        }

        while (
            operators.length &&
            operators[
                operators.length - 1
            ] !== "(" &&
            precedence[
                operators[
                    operators.length - 1
                ]
            ] >=
                precedence[token]
        ) {
            output.push(
                operators.pop()
            );
        }

        operators.push(token);

        previous =
            "operator";
    }

    while (
        operators.length
    ) {
        const operator =
            operators.pop();

        if (
            operator === "(" ||
            operator === ")"
        ) {
            throw new Error(
                "Mismatched parentheses."
            );
        }

        output.push(
            operator
        );
    }

    return output;
}

function evaluateRpn(rpn) {
    const stack = [];

    for (
        const token of rpn
    ) {
        if (
            typeof token ===
            "number"
        ) {
            stack.push(token);
            continue;
        }

        const b =
            stack.pop();

        const a =
            stack.pop();

        if (
            a === undefined ||
            b === undefined
        ) {
            throw new Error(
                "Invalid expression."
            );
        }

        switch (token) {
            case "+":
                stack.push(a + b);
                break;

            case "-":
                stack.push(a - b);
                break;

            case "*":
                stack.push(a * b);
                break;

            case "/":
                if (b === 0) {
                    throw new Error(
                        "Division by zero."
                    );
                }

                stack.push(a / b);
                break;

            default:
                throw new Error(
                    "Unsupported operator."
                );
        }
    }

    if (
        stack.length !== 1 ||
        !Number.isFinite(
            stack[0]
        )
    ) {
        throw new Error(
            "Invalid calculation."
        );
    }

    return stack[0];
}

export function calculateExpression(
    expression
) {
    return evaluateRpn(
        toRpn(
            tokenize(
                expression
            )
        )
    );
}
