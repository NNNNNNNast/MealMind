package org.chef.smartchef.utils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.*;
import java.util.Collections;
import java.util.List;

public class JsonListTypeHandler extends BaseTypeHandler<List<String>> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, List<String> parameter, JdbcType jdbcType) throws SQLException {
        try {
            String json = objectMapper.writeValueAsString(parameter);
            ps.setString(i, json);
        } catch (Exception e) {
            throw new SQLException("Error serializing List to JSON", e);
        }
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, String columnName) throws SQLException {
       // System.out.println(">>> [TypeHandler] Called for column: " + columnName);
        Object obj = rs.getObject(columnName);
        //System.out.println(">>> [TypeHandler] Raw object from DB: " + obj + " (class: " + (obj != null ? obj.getClass().getName() : "null") + ")");
        return parseJson(obj);
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parseJson(rs.getObject(columnIndex));
    }

    @Override
    public List<String> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parseJson(cs.getObject(columnIndex));
    }



    // ✅ 关键修改：接收 Object，安全转为 String
    private List parseJson(Object value) throws SQLException {
//System.out.println(">>> [DEBUG] JsonListTypeHandler.parseJson 被调用，接收到的原始 value 类型: " + (value == null ? "null" : value.getClass().getName()));
        //System.out.println(">>> [DEBUG] 原始 value 内容: " + value);

        if (value == null) {
            //System.out.println(">>> [DEBUG] value 为 null，返回空列表。");
            return Collections.emptyList();
        }

        String json = (value instanceof String) ? (String) value : value.toString();
        //System.out.println(">>> [DEBUG] 转换后的 JSON 字符串: " + json);

        try {
            List result = objectMapper.readValue(json.trim(), new TypeReference<List>() {});
            //System.out.println(">>> [DEBUG] 反序列化成功，列表大小: " + result.size() + "，内容: " + result);
            return result;
        } catch (Exception e) {
            //System.err.println("!!! [ERROR] 反序列化 JSON 失败: " + json);
            e.printStackTrace(); // 打印堆栈信息到控制台
            throw new SQLException("Deserialize JSON failed: " + json, e);
        }
    }
}