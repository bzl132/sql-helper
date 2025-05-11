package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

/**
 * @Descript 农险-标的地址
 * @auth lyr
 * @date 2023/12/3 16:16
 */
@Data
public class SubjectAddressMG {
    /** 洲际代码 */
    private String ihgCode;
    /**国籍代码*/
    private String countryCode;
    /** 省份代码 */
    private String provinceCode;
    /** 城市代码 */
    private String cityCode;
    /** 区县代码 */
    private String countyCode;
    /** 村级代码 */
    private String villageCode;
    /** 乡级代码 */
    private String townCode;
    /** 邮政编码**/
    private String postalCode;
    /** 街道地址**/
    private String streetAddress;

    /**国籍名称*/
    private String countryName;
    /** 省份代码 */
    private String provinceName;
    /** 城市代码 */
    private String cityName;
    /** 区县代码 */
    private String countyName;
    /** 乡级代码 */
    private String townName;
    /** 村级代码 */
    private String villageName;
    /** 详细地址 **/
    private String detailAddress;
    /** 标的详细地址 **/
    private String subjectDetailAddress;

}
