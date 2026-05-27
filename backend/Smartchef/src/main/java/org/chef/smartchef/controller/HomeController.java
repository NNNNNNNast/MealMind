package org.chef.smartchef.controller;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController()
public class HomeController {

    //测试接口
    @GetMapping("/hello")
    public String HelloWorld()
    {
        System.out.println("Hello World");
        return "Hello World";
    }
}
