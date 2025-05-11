package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

/**
 * @Descript 信保-关联项目
 * @auth lyr
 * @date 2023/12/3 16:16
 */
@Data
public class RelatedProjectMG {

    /**
     * 项目名称
     */
    private String projectName;
    /**
     * 项目编码
     */
    private String projectCode;

}
