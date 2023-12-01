import { Injectable, UnauthorizedException, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        // Check if there is no user or an error is thrown
        if (err || !user) {
            let errorMessage = "Unauthorized";

            // Handle token errors
            if (info instanceof TokenExpiredError) {
                errorMessage = "Token has expired";
            } else if (info instanceof JsonWebTokenError) {
                errorMessage = "Invalid Token"
            } else if (info && info.message === "No auth token") {
                errorMessage = "No Token provided."
            }

            throw new UnauthorizedException(errorMessage);
        }

        // Return the user object on successful authentication
        return user;
    }
}