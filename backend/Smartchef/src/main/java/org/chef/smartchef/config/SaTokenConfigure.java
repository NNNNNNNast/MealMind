package org.chef.smartchef.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SaTokenConfigure implements WebMvcConfigurer {

    //Sa-Token 拦截器
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        //拦截所有请求
        registry.addInterceptor(new SaInterceptor())
                .addPathPatterns("/**")  // 拦截所有路径
                .excludePathPatterns(
                        "/user/login",      // 登录接口不拦截
                        "/user/logout",     // 退出接口
                        "/admin/login",     // 管理员登录
                        "/swagger-resources/**",
                        "/webjars/**",
                        "/v3/**",
                        "/doc.html/**"
                );
    }
}