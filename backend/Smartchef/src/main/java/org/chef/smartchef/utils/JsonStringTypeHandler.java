package org.chef.smartchef.utils;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedTypes;
import org.apache.ibatis.type.MappedJdbcTypes;

import java.sql.*;

@MappedTypes(String.class)
@MappedJdbcTypes(JdbcType.VARCHAR)
public class JsonStringTypeHandler extends BaseTypeHandler<String> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, String parameter, JdbcType jdbcType)
            throws SQLException {
        ps.setString(i, parameter);
    }

    @Override
    public String getNullableResult(ResultSet rs, String columnName) throws SQLException {
        try {
            String value = rs.getString(columnName);
            if (value != null) {
                return value;
            }
            Object obj = rs.getObject(columnName);
            return obj != null ? obj.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public String getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        try {
            String value = rs.getString(columnIndex);
            if (value != null) {
                return value;
            }
            Object obj = rs.getObject(columnIndex);
            return obj != null ? obj.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public String getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        try {
            String value = cs.getString(columnIndex);
            if (value != null) {
                return value;
            }
            Object obj = cs.getObject(columnIndex);
            return obj != null ? obj.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }
}