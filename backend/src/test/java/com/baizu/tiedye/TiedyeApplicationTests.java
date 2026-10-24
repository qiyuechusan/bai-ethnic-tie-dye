package com.baizu.tiedye;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * 上下文冒烟测试。默认使用 H2 内存库，避免测试依赖本机 MySQL。
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:tiedye-smoke;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "app.ai.mode=offline",
        "app.ai.api-key="
})
@ActiveProfiles("test")
class TiedyeApplicationTests {

    @Test
    void contextLoads() {
    }
}
