

import java.util.Date;

public class MongoBean {

    // 基本类型
    private String name;
    private int id;
    private boolean isC;
    private int[] nums;
    
    // 数值类型
    private long longValue;
    private double doubleValue;
    private float floatValue;
    private byte byteValue;
    private short shortValue;
    
    // 包装类型
    private Integer integerObj;
    private Long longObj;
    private Double doubleObj;
    private Boolean booleanObj;
    
    // 日期时间类型
    private Date createTime;
    private java.sql.Date sqlDate;
    private java.sql.Timestamp timestamp;
    
    
    // 枚举类型
    private Status status;
    
    // 嵌套对象
    private Address address;
    
    public enum Status {
        ACTIVE, INACTIVE, PENDING
    }
    
    public static class Address {
        private String street;
        private String city;
        private String zipCode;
        
        public Address() {
        }
        
        public String getStreet() {
            return street;
        }
        
        public void setStreet(String street) {
            this.street = street;
        }
        
        public String getCity() {
            return city;
        }
        
        public void setCity(String city) {
            this.city = city;
        }
        
        public String getZipCode() {
            return zipCode;
        }
        
        public void setZipCode(String zipCode) {
            this.zipCode = zipCode;
        }
    }
    
    public MongoBean() {
        
    }
    
    // Getters and Setters
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public int getId() {
        return id;
    }
    
    public void setId(int id) {
        this.id = id;
    }
    
    public boolean isC() {
        return isC;
    }
    
    public void setC(boolean isC) {
        this.isC = isC;
    }
    
    public int[] getNums() {
        return nums;
    }
    
    public void setNums(int[] nums) {
        this.nums = nums;
    }
    
    public long getLongValue() {
        return longValue;
    }
    
    public void setLongValue(long longValue) {
        this.longValue = longValue;
    }
    
    public double getDoubleValue() {
        return doubleValue;
    }
    
    public void setDoubleValue(double doubleValue) {
        this.doubleValue = doubleValue;
    }
    
    public float getFloatValue() {
        return floatValue;
    }
    
    public void setFloatValue(float floatValue) {
        this.floatValue = floatValue;
    }
    
    public byte getByteValue() {
        return byteValue;
    }
    
    public void setByteValue(byte byteValue) {
        this.byteValue = byteValue;
    }
    
    public short getShortValue() {
        return shortValue;
    }
    
    public void setShortValue(short shortValue) {
        this.shortValue = shortValue;
    }
    
    public Integer getIntegerObj() {
        return integerObj;
    }
    
    public void setIntegerObj(Integer integerObj) {
        this.integerObj = integerObj;
    }
    
    public Long getLongObj() {
        return longObj;
    }
    
    public void setLongObj(Long longObj) {
        this.longObj = longObj;
    }
    
    public Double getDoubleObj() {
        return doubleObj;
    }
    
    public void setDoubleObj(Double doubleObj) {
        this.doubleObj = doubleObj;
    }
    
    public Boolean getBooleanObj() {
        return booleanObj;
    }
    
    public void setBooleanObj(Boolean booleanObj) {
        this.booleanObj = booleanObj;
    }
    
    public Date getCreateTime() {
        return createTime;
    }
    
    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }
    
    public java.sql.Date getSqlDate() {
        return sqlDate;
    }
    
    public void setSqlDate(java.sql.Date sqlDate) {
        this.sqlDate = sqlDate;
    }
    
    public java.sql.Timestamp getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(java.sql.Timestamp timestamp) {
        this.timestamp = timestamp;
    }
    
    public Status getStatus() {
        return status;
    }
    
    public void setStatus(Status status) {
        this.status = status;
    }
    
    public Address getAddress() {
        return address;
    }
    
    public void setAddress(Address address) {
        this.address = address;
    }
}