import { NextFunction, Request, Response } from "express";

const authenticationMiddleware = (
    request: Request,
    response: Response,
    next: NextFunction
) => {
    if (!request.session.user) {
        response.redirect("/signin");
    } else {
        response.locals.user = request.session.user;
        next();
    }
};

export default authenticationMiddleware;
