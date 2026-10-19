package com.librarymanagement.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    /**
     * Forwards non-API client routes to React's index.html to support HTML5 client-side routing.
     */
    @GetMapping(value = {
            "/login",
            "/librarian",
            "/librarian/**",
            "/student",
            "/student/**"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
