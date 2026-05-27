package org.chef.smartchef;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("org.chef.smartchef.mapper")
public class SmartchefApplication {

	public static void main(String[] args) {

		SpringApplication.run(SmartchefApplication.class, args);

	}

}
